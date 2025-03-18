document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  const displayCanvas = document.getElementById("display-canvas");
  const ctx = canvas.getContext("2d");
  const displayCtx = displayCanvas.getContext("2d");
  const captureBtn = document.getElementById("capture-btn");
  const downloadBtn = document.getElementById("download-btn");
  const resetBtn = document.getElementById("reset-btn");
  const resultImage = document.getElementById("result-image");
  const resultContainer = document.querySelector(".result-container");
  const moodButtons = document.querySelectorAll(".mood-btn");
  const stickerBtn = document.getElementById("sticker-btn");
  const voiceEffectBtn = document.getElementById("voice-effect-btn");
  const animateBtn = document.getElementById("animate-btn");
  const beautifyBtn = document.getElementById("beautify-btn");
  const stickerPanel = document.querySelector(".sticker-panel");
  const stickers = document.querySelectorAll(".sticker");
  const closeStickerPanelBtn = document.getElementById("close-sticker-panel");
  const stickerContainer = document.getElementById("sticker-container");
  const captureOverlay = document.getElementById("capture-overlay");

  // 当前选中的心情
  let currentMood = "";

  // 性能标志
  let isRendering = false;
  let isBeautifyEnabled = false;
  let isAnimationEnabled = false;
  let isVoiceEffectEnabled = false;

  // 控制视频尺寸（质量）
  const videoConstraints = {
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: "user",
  };

  // 帧率控制
  let lastTime = 0;
  const FPS = 24; // 降低FPS以提高性能
  const interval = 1000 / FPS;

  // 当前应用的贴纸
  const activeStickers = [];

  // 心情对应的变形效果和装饰
  const moodElements = {
    happy: {
      emoji: "😊",
      color: "rgba(255, 255, 0, 0.2)",
      filterClass: "filter-happy",
      bgClass: "bg-happy",
      distortion: {
        effect: bulgeEffect,
        strength: 0.2,
        description: "阳光凸起效果",
      },
    },
    sad: {
      emoji: "😢",
      color: "rgba(0, 0, 255, 0.2)",
      filterClass: "filter-sad",
      bgClass: "bg-sad",
      distortion: {
        effect: waveEffect,
        strength: 8,
        frequency: 0.05,
        description: "水滴波浪效果",
      },
    },
    angry: {
      emoji: "😠",
      color: "rgba(255, 0, 0, 0.2)",
      filterClass: "filter-angry",
      bgClass: "bg-angry",
      distortion: {
        effect: twistEffect,
        strength: 0.03,
        description: "扭曲旋转效果",
      },
    },
    surprised: {
      emoji: "😲",
      color: "rgba(128, 0, 128, 0.2)",
      filterClass: "filter-surprised",
      bgClass: "bg-surprised",
      distortion: {
        effect: fisheyeEffect,
        strength: 1.5,
        description: "鱼眼夸张效果",
      },
    },
    cool: {
      emoji: "😎",
      color: "rgba(0, 255, 255, 0.2)",
      filterClass: "filter-cool",
      bgClass: "bg-cool",
      distortion: {
        effect: ghostEffect,
        strength: 0.2,
        description: "动感分身效果",
      },
    },
    love: {
      emoji: "❤️",
      color: "rgba(255, 105, 180, 0.2)",
      filterClass: "filter-love",
      bgClass: "bg-love",
      distortion: {
        effect: heartEffect,
        strength: 0.15,
        description: "甜蜜粉红效果",
      },
    },
  };

  // 启动相机（优化性能）
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false, // 默认不开启音频
      });
      video.srcObject = stream;

      // 设置canvas尺寸与视频一致
      video.addEventListener("loadedmetadata", () => {
        // 根据设备的性能调整canvas大小
        const scale = isMobileDevice() ? 0.7 : 1.0; // 移动设备降低分辨率
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        displayCanvas.width = canvas.width;
        displayCanvas.height = canvas.height;

        // 开始渲染
        isRendering = true;
        requestAnimationFrame(renderFrame);
      });
    } catch (err) {
      console.error("相机访问出错:", err);
      alert(
        "无法访问相机。请确保您已授予相机访问权限，并且您的设备有可用的相机。"
      );
    }
  }

  // 检测是否为移动设备
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // 渲染视频帧，应用实时特效
  function renderFrame(currentTime) {
    if (!isRendering) return;

    // 控制帧率
    if (currentTime - lastTime < interval) {
      requestAnimationFrame(renderFrame);
      return;
    }
    lastTime = currentTime;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    // 将视频帧绘制到隐藏的canvas上
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 从隐藏canvas获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 创建一个新的ImageData对象用于显示
    const displayData = displayCtx.createImageData(
      displayCanvas.width,
      displayCanvas.height
    );

    // 应用美颜效果（如果启用）
    let processedData = imageData;
    if (isBeautifyEnabled) {
      processedData = applyBeautifyEffect(imageData);
    }

    // 应用变形效果（如果选择了心情）
    if (
      currentMood &&
      moodElements[currentMood] &&
      moodElements[currentMood].distortion
    ) {
      applyDistortionEffect(
        processedData,
        displayData,
        moodElements[currentMood].distortion,
        isAnimationEnabled
      );
    } else {
      // 如果没有选择心情或没有变形效果，直接复制像素数据
      new Uint32Array(displayData.data.buffer).set(
        new Uint32Array(processedData.data.buffer)
      );
    }

    // 将处理后的图像绘制到显示canvas
    displayCtx.putImageData(displayData, 0, 0);

    // 应用心情滤镜（通过CSS类）
    if (currentMood) {
      displayCanvas.className = moodElements[currentMood].filterClass;

      // 添加动画效果（如果启用）
      if (isAnimationEnabled) {
        displayCanvas.classList.add("animate-pulse");
      } else {
        displayCanvas.classList.remove("animate-pulse");
      }
    }

    // 继续渲染下一帧
    requestAnimationFrame(renderFrame);
  }

  // 美颜效果
  function applyBeautifyEffect(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 简单的美颜效果：亮度微调和肤色平滑
    for (let i = 0; i < data.length; i += 4) {
      // 增加亮度
      data[i] = Math.min(255, data[i] * 1.05); // R
      data[i + 1] = Math.min(255, data[i + 1] * 1.05); // G
      data[i + 2] = Math.min(255, data[i + 2] * 1.05); // B

      // 微妙的肤色平滑
      if (isPixelSkin(data[i], data[i + 1], data[i + 2])) {
        data[i] = data[i] * 0.95 + 10; // 微调红色
        data[i + 1] = data[i + 1] * 0.95 + 5; // 微调绿色
      }
    }

    return imageData;
  }

  // 简单的肤色检测
  function isPixelSkin(r, g, b) {
    // 粗略的肤色检测算法
    return r > 60 && g > 40 && b > 20 && r > g && r > b && r - g > 15;
  }

  // 凸起效果实现
  function bulgeEffect(srcX, srcY, width, height, strength, time = 0) {
    const centerX = width / 2;
    const centerY = height / 2;

    const dx = srcX - centerX;
    const dy = srcY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

    // 凸起强度随距离衰减
    const factor = 1 - (distance / maxDistance) * strength;

    return {
      x: centerX + dx * factor,
      y: centerY + dy * factor,
    };
  }

  // 波浪效果实现
  function waveEffect(
    srcX,
    srcY,
    width,
    height,
    strength,
    frequency,
    time = 0
  ) {
    // 添加时间因子使波浪动起来
    const waveX = Math.sin(srcY * frequency + time * 0.002) * strength;
    const waveY = Math.sin(srcX * frequency + time * 0.002) * strength;

    return {
      x: srcX + waveX,
      y: srcY + waveY,
    };
  }

  // 鱼眼效果实现
  function fisheyeEffect(srcX, srcY, width, height, strength, time = 0) {
    const centerX = width / 2;
    const centerY = height / 2;

    const dx = srcX - centerX;
    const dy = srcY - centerY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const theta = Math.atan2(dy, dx);

    // 计算新的半径
    const r =
      Math.pow(
        distance / Math.sqrt(centerX * centerX + centerY * centerY),
        strength
      ) * distance;

    // 转换回笛卡尔坐标
    return {
      x: centerX + r * Math.cos(theta),
      y: centerY + r * Math.sin(theta),
    };
  }

  // 扭曲效果实现
  function twistEffect(srcX, srcY, width, height, strength, time = 0) {
    const centerX = width / 2;
    const centerY = height / 2;

    const dx = srcX - centerX;
    const dy = srcY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 角度随距离变化，添加时间因子使旋转变动
    const angle = strength * distance + time * 0.0005;

    // 旋转变换
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    return {
      x: centerX + dx * cosAngle - dy * sinAngle,
      y: centerY + dx * sinAngle + dy * cosAngle,
    };
  }

  // 分身效果
  function ghostEffect(srcX, srcY, width, height, strength, time = 0) {
    // 根据时间偏移原始位置
    const offsetX = Math.sin(time * 0.001) * strength * width;

    // 创建分身效果，实际上是在原始位置的基础上添加光影效果
    if (srcX < width / 2) {
      return {
        x: srcX - strength * 5,
        y: srcY,
      };
    } else {
      return {
        x: srcX + strength * 5,
        y: srcY,
      };
    }
  }

  // 心形效果
  function heartEffect(srcX, srcY, width, height, strength, time = 0) {
    const centerX = width / 2;
    const centerY = height / 2;

    const dx = srcX - centerX;
    const dy = srcY - centerY;

    // 计算到中心的距离
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.min(width, height) / 2;

    // 计算心形变形因子
    let factor = 1;
    if (distance < maxDistance) {
      // 心形变形公式
      const heartShape =
        Math.sin((distance / maxDistance) * Math.PI) * strength;
      factor = 1 - heartShape;
    }

    return {
      x: centerX + dx * factor,
      y: centerY + dy * factor,
    };
  }

  // 应用变形效果到像素数据（优化版本）
  function applyDistortionEffect(
    sourceData,
    targetData,
    effectConfig,
    animate = false
  ) {
    const { width, height } = sourceData;
    const { effect, strength, frequency } = effectConfig;

    // 获取当前时间毫秒数用于动画效果
    const time = animate ? performance.now() : 0;

    // 创建源数据和目标数据的Uint32视图以加速处理
    const sourceUint32 = new Uint32Array(sourceData.data.buffer);
    const targetUint32 = new Uint32Array(targetData.data.buffer);

    // 设置目标数据为透明（全部填充0）
    targetUint32.fill(0);

    // 使用更高效的方式遍历图像
    // 每隔2个像素采样一次以提高性能，移动设备可以考虑每隔3个像素
    const step = isMobileDevice() ? 3 : 2;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        // 计算源图像中的对应像素位置
        const result = effect(x, y, width, height, strength, frequency, time);

        const srcX = Math.floor(result.x);
        const srcY = Math.floor(result.y);

        // 检查边界
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          // 复制源像素到目标像素，使用Uint32可以一次处理4个字节(RGBA)
          const targetIndex = y * width + x;
          const sourceIndex = srcY * width + srcX;

          // 填充当前像素及周围像素以避免出现空白
          targetUint32[targetIndex] = sourceUint32[sourceIndex];

          // 填充相邻像素
          if (x + 1 < width)
            targetUint32[targetIndex + 1] = sourceUint32[sourceIndex];
          if (y + 1 < height)
            targetUint32[(y + 1) * width + x] = sourceUint32[sourceIndex];
          if (x + 1 < width && y + 1 < height)
            targetUint32[(y + 1) * width + x + 1] = sourceUint32[sourceIndex];
        }
      }
    }
  }

  // 初始化应用
  startCamera();

  // 监听心情按钮点击事件
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 移除所有按钮的active类
      moodButtons.forEach((b) => b.classList.remove("active"));

      // 为当前按钮添加active类
      btn.classList.add("active");

      // 更新当前心情
      currentMood = btn.dataset.mood;

      // 移除之前的背景类
      captureOverlay.className = "";
      document.body.className = "";

      // 添加新的背景类
      if (currentMood && moodElements[currentMood]) {
        captureOverlay.classList.add(moodElements[currentMood].bgClass);
        document.body.classList.add(moodElements[currentMood].bgClass);

        // 添加心情装饰
        addMoodDecorations(currentMood);
      }
    });
  });

  // 监听功能按钮点击事件
  stickerBtn.addEventListener("click", () => {
    // 显示/隐藏贴纸面板
    stickerPanel.style.display =
      stickerPanel.style.display === "none" ? "block" : "none";

    // 切换按钮状态
    stickerBtn.classList.toggle("active");
  });

  beautifyBtn.addEventListener("click", () => {
    isBeautifyEnabled = !isBeautifyEnabled;
    beautifyBtn.classList.toggle("active");
  });

  animateBtn.addEventListener("click", () => {
    isAnimationEnabled = !isAnimationEnabled;
    animateBtn.classList.toggle("active");
  });

  voiceEffectBtn.addEventListener("click", () => {
    // 切换语音效果状态
    isVoiceEffectEnabled = !isVoiceEffectEnabled;
    voiceEffectBtn.classList.toggle("active");

    // 语音效果逻辑
    if (isVoiceEffectEnabled) {
      startVoiceEffect();
    } else {
      stopVoiceEffect();
    }
  });

  // 关闭贴纸面板
  closeStickerPanelBtn.addEventListener("click", () => {
    stickerPanel.style.display = "none";
    stickerBtn.classList.remove("active");
  });

  // 贴纸选择
  stickers.forEach((sticker) => {
    sticker.addEventListener("click", () => {
      addStickerToCanvas(sticker.dataset.sticker);
    });
  });

  // 语音效果（模拟）
  let audioContext;
  let analyzer;
  let microphone;

  function startVoiceEffect() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("您的浏览器不支持音频功能");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true, video: false })
      .then((stream) => {
        // 创建音频处理环境
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyzer = audioContext.createAnalyser();

        // 连接麦克风
        microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyzer);

        // 这里可以添加更多音频处理和特效
        console.log("语音效果已启动");

        // 添加视觉反馈，根据声音大小添加动态效果
        visualizeAudio();
      })
      .catch((err) => {
        console.error("无法访问麦克风:", err);
        alert("无法访问麦克风，请确保您已授予麦克风访问权限。");

        // 重置状态
        isVoiceEffectEnabled = false;
        voiceEffectBtn.classList.remove("active");
      });
  }

  function stopVoiceEffect() {
    if (audioContext) {
      microphone && microphone.disconnect();
      audioContext = null;
      analyzer = null;
      microphone = null;
      console.log("语音效果已关闭");
    }
  }

  function visualizeAudio() {
    if (!analyzer || !isVoiceEffectEnabled) return;

    // 创建数据数组
    const dataArray = new Uint8Array(analyzer.frequencyBinCount);

    // 获取频率数据
    analyzer.getByteFrequencyData(dataArray);

    // 计算音量平均值
    const average =
      dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;

    // 根据音量大小改变效果
    if (average > 50) {
      // 较大的声音
      // 添加视觉反馈
      captureOverlay.style.opacity = Math.min(1, average / 200);
    } else {
      captureOverlay.style.opacity = 0.3;
    }

    // 循环调用以创建实时效果
    if (isVoiceEffectEnabled) {
      requestAnimationFrame(visualizeAudio);
    }
  }

  // 添加贴纸到画布
  function addStickerToCanvas(emoji) {
    const stickerElem = document.createElement("div");
    stickerElem.textContent = emoji;
    stickerElem.className = "sticker-item";
    stickerElem.style.left = `${Math.random() * 80 + 10}%`;
    stickerElem.style.top = `${Math.random() * 80 + 10}%`;

    // 使贴纸可拖动
    makeDraggable(stickerElem);

    // 添加到贴纸容器
    stickerContainer.appendChild(stickerElem);

    // 记录活动贴纸
    activeStickers.push(stickerElem);

    // 隐藏贴纸面板
    stickerPanel.style.display = "none";
  }

  // 使元素可拖动
  function makeDraggable(element) {
    let pos1 = 0,
      pos2 = 0,
      pos3 = 0,
      pos4 = 0;

    element.onmousedown = dragMouseDown;
    element.ontouchstart = dragTouchStart;

    function dragMouseDown(e) {
      e.preventDefault();
      // 获取鼠标开始位置
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function dragTouchStart(e) {
      const touch = e.touches[0];
      pos3 = touch.clientX;
      pos4 = touch.clientY;
      document.ontouchend = closeDragElement;
      document.ontouchmove = elementTouchDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      // 计算新位置
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      // 设置元素的新位置
      element.style.top = element.offsetTop - pos2 + "px";
      element.style.left = element.offsetLeft - pos1 + "px";
    }

    function elementTouchDrag(e) {
      const touch = e.touches[0];
      pos1 = pos3 - touch.clientX;
      pos2 = pos4 - touch.clientY;
      pos3 = touch.clientX;
      pos4 = touch.clientY;
      element.style.top = element.offsetTop - pos2 + "px";
      element.style.left = element.offsetLeft - pos1 + "px";
    }

    function closeDragElement() {
      // 停止移动
      document.onmouseup = null;
      document.onmousemove = null;
      document.ontouchend = null;
      document.ontouchmove = null;
    }
  }

  // 添加心情装饰
  function addMoodDecorations(mood) {
    // 清除现有装饰
    captureOverlay.innerHTML = "";

    const moodInfo = moodElements[mood];

    // 添加不同的心情装饰效果
    switch (mood) {
      case "happy":
        addEmojis("😊", 3, "random", "30px");
        addEmojis("🌞", 2, "top", "40px");
        break;
      case "sad":
        addEmojis("💧", 4, "top", "25px");
        addEmojis("🌧️", 1, "top", "40px");
        break;
      case "angry":
        addEmojis("💢", 2, "random", "35px");
        addEmojis("🔥", 2, "bottom", "30px");
        break;
      case "surprised":
        addEmojis("⭐", 3, "random", "25px");
        addEmojis("❗", 1, "side", "45px");
        break;
      case "cool":
        addEmojis("🕶️", 1, "center", "70px");
        addEmojis("✨", 4, "random", "20px");
        break;
      case "love":
        addEmojis("❤️", 4, "random", "20px");
        addEmojis("💕", 2, "side", "25px");
        break;
    }
  }

  // 添加表情装饰（减少装饰数量以提高性能）
  function addEmojis(emoji, count, position, size) {
    for (let i = 0; i < count; i++) {
      const emojiElem = document.createElement("div");
      emojiElem.textContent = emoji;
      emojiElem.style.position = "absolute";
      emojiElem.style.fontSize = size || "30px";
      emojiElem.style.zIndex = "5";
      emojiElem.style.opacity = "0.7";
      emojiElem.style.textShadow = "0 0 5px rgba(255,255,255,0.7)";

      // 根据位置参数设置表情位置
      if (position === "random") {
        emojiElem.style.left = `${Math.random() * 90}%`;
        emojiElem.style.top = `${Math.random() * 90}%`;
      } else if (position === "top") {
        emojiElem.style.left = `${10 + (i * 80) / count}%`;
        emojiElem.style.top = "10%";
      } else if (position === "bottom") {
        emojiElem.style.left = `${10 + (i * 80) / count}%`;
        emojiElem.style.bottom = "10%";
      } else if (position === "side") {
        if (i % 2 === 0) {
          emojiElem.style.left = "5%";
          emojiElem.style.top = `${20 + (i * 60) / count}%`;
        } else {
          emojiElem.style.right = "5%";
          emojiElem.style.top = `${20 + ((i - 1) * 60) / count}%`;
        }
      } else if (position === "center") {
        emojiElem.style.left = "50%";
        emojiElem.style.top = "50%";
        emojiElem.style.transform = "translate(-50%, -50%)";
      }

      captureOverlay.appendChild(emojiElem);
    }
  }

  // 拍照按钮点击事件
  captureBtn.addEventListener("click", () => {
    if (!currentMood) {
      alert("请先选择一个心情！");
      return;
    }

    // 显示结果容器
    resultContainer.style.display = "block";

    // 启用下载按钮
    downloadBtn.disabled = false;

    // 创建装饰层副本
    const decorations = captureOverlay.innerHTML;

    // 创建一个临时的canvas用于合成最终图像
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = displayCanvas.width;
    tempCanvas.height = displayCanvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // 绘制显示canvas的内容（已经包含变形效果）
    tempCtx.drawImage(displayCanvas, 0, 0);

    // 添加滤镜效果的半透明叠加
    if (currentMood && moodElements[currentMood]) {
      tempCtx.fillStyle = moodElements[currentMood].color;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    // 将最终结果设置为图像源
    resultImage.src = tempCanvas.toDataURL("image/png");

    // 确保结果图像已经可见
    resultImage.style.display = "block";

    // 将装饰层添加到结果容器中
    const decorationContainer = document.createElement("div");
    decorationContainer.style.position = "absolute";
    decorationContainer.style.top = "0";
    decorationContainer.style.left = "0";
    decorationContainer.style.width = "100%";
    decorationContainer.style.height = "100%";
    decorationContainer.style.pointerEvents = "none";
    decorationContainer.innerHTML = decorations;

    // 确保结果容器有相对定位
    resultContainer.style.position = "relative";

    // 清除之前的装饰
    const oldDecorations = resultContainer.querySelector(".result-decorations");
    if (oldDecorations) {
      resultContainer.removeChild(oldDecorations);
    }

    // 添加新的装饰
    decorationContainer.className = "result-decorations";
    resultContainer.appendChild(decorationContainer);

    // 贴纸复制
    const stickerCopy = document.createElement("div");
    stickerCopy.style.position = "absolute";
    stickerCopy.style.top = "0";
    stickerCopy.style.left = "0";
    stickerCopy.style.width = "100%";
    stickerCopy.style.height = "100%";
    stickerCopy.style.pointerEvents = "none";

    // 复制所有活动贴纸
    activeStickers.forEach((sticker) => {
      const clone = document.createElement("div");
      clone.textContent = sticker.textContent;
      clone.style.position = "absolute";
      clone.style.fontSize = sticker.style.fontSize;
      clone.style.left = sticker.style.left;
      clone.style.top = sticker.style.top;
      stickerCopy.appendChild(clone);
    });

    stickerCopy.className = "stickers-copy";
    resultContainer.appendChild(stickerCopy);

    // 添加拍照音效
    playSound("camera");

    // 滚动到结果区域
    resultContainer.scrollIntoView({ behavior: "smooth" });
  });

  // 下载按钮点击事件
  downloadBtn.addEventListener("click", () => {
    if (!resultImage.src) return;

    // 创建一个包含装饰和滤镜的合成canvas
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = displayCanvas.width;
    finalCanvas.height = displayCanvas.height;
    const finalCtx = finalCanvas.getContext("2d");

    // 加载图像
    const img = new Image();
    img.crossOrigin = "Anonymous"; // 添加跨域支持

    img.onload = function () {
      // 绘制图像
      finalCtx.drawImage(img, 0, 0);

      // 创建下载链接
      const link = document.createElement("a");
      link.download = `我的${moodElements[currentMood].emoji}心情照片.png`;

      // 使用toDataURL直接从resultImage获取数据
      link.href = resultImage.src;

      // 触发点击事件
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 添加下载音效
      playSound("download");
    };
    img.src = resultImage.src;
  });

  // 重置按钮点击事件
  resetBtn.addEventListener("click", () => {
    // 隐藏结果容器
    resultContainer.style.display = "none";

    // 重置心情选择
    moodButtons.forEach((btn) => btn.classList.remove("active"));
    currentMood = "";

    // 重置功能按钮状态
    beautifyBtn.classList.remove("active");
    animateBtn.classList.remove("active");
    stickerBtn.classList.remove("active");
    voiceEffectBtn.classList.remove("active");

    isBeautifyEnabled = false;
    isAnimationEnabled = false;
    isVoiceEffectEnabled = false;

    // 停止语音效果
    stopVoiceEffect();

    // 清除所有滤镜类
    displayCanvas.className = "";
    captureOverlay.className = "";
    document.body.className = "";
    displayCanvas.classList.remove("animate-pulse");

    // 清除装饰
    captureOverlay.innerHTML = "";

    // 清除贴纸
    stickerContainer.innerHTML = "";
    activeStickers.length = 0; // 清空数组

    // 隐藏贴纸面板
    stickerPanel.style.display = "none";

    // 禁用下载按钮
    downloadBtn.disabled = true;

    // 添加重置音效
    playSound("reset");
  });

  // 音效功能
  function playSound(type) {
    // 创建音频上下文
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    switch (type) {
      case "camera":
        // 相机快门音效
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          10,
          audioCtx.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioCtx.currentTime + 0.2
        );
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
        break;

      case "download":
        // 下载完成音效
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(
          1000,
          audioCtx.currentTime + 0.1
        );
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
        break;

      case "reset":
        // 重置音效
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
        oscillator.frequency.linearRampToValueAtTime(
          100,
          audioCtx.currentTime + 0.2
        );
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
        break;
    }
  }
});
