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
  const distortionButtons = document.querySelectorAll(".distortion-btn");
  const captureOverlay = document.getElementById("capture-overlay");

  // 当前选中的心情和变形效果
  let currentMood = "";
  let currentDistortion = "none";

  // 是否开始渲染
  let isRendering = false;

  // 摄像头帧率控制
  let lastTime = 0;
  const FPS = 30;
  const interval = 1000 / FPS;

  // 心情表情素材 (使用CSS和叠加层实现)
  const moodElements = {
    happy: {
      emoji: "😊",
      color: "rgba(255, 255, 0, 0.2)",
      filterClass: "filter-happy",
      bgClass: "bg-happy",
    },
    sad: {
      emoji: "😢",
      color: "rgba(0, 0, 255, 0.2)",
      filterClass: "filter-sad",
      bgClass: "bg-sad",
    },
    angry: {
      emoji: "😠",
      color: "rgba(255, 0, 0, 0.2)",
      filterClass: "filter-angry",
      bgClass: "bg-angry",
    },
    surprised: {
      emoji: "😲",
      color: "rgba(128, 0, 128, 0.2)",
      filterClass: "filter-surprised",
      bgClass: "bg-surprised",
    },
    cool: {
      emoji: "😎",
      color: "rgba(0, 255, 255, 0.2)",
      filterClass: "filter-cool",
      bgClass: "bg-cool",
    },
    love: {
      emoji: "❤️",
      color: "rgba(255, 105, 180, 0.2)",
      filterClass: "filter-love",
      bgClass: "bg-love",
    },
  };

  // 变形效果参数设置
  const distortionEffects = {
    none: {
      effect: (srcX, srcY, width, height) => ({ x: srcX, y: srcY }),
      strength: 0,
    },
    bulge: {
      effect: bulgeEffect,
      strength: 0.3,
      description: "中央凸起效果",
    },
    pinch: {
      effect: pinchEffect,
      strength: -0.3,
      description: "中央凹陷效果",
    },
    wave: {
      effect: waveEffect,
      strength: 15,
      frequency: 0.1,
      description: "波浪扭曲效果",
    },
    fisheye: {
      effect: fisheyeEffect,
      strength: 1.2,
      description: "鱼眼镜头效果",
    },
    twist: {
      effect: twistEffect,
      strength: 0.04,
      description: "旋转扭曲效果",
    },
  };

  // 启动相机
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      video.srcObject = stream;

      // 设置canvas尺寸与视频一致
      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        displayCanvas.width = video.videoWidth;
        displayCanvas.height = video.videoHeight;

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

  // 渲染视频帧，应用实时特效
  function renderFrame(currentTime) {
    if (!isRendering) return;

    // 控制帧率
    if (currentTime - lastTime < interval) {
      requestAnimationFrame(renderFrame);
      return;
    }
    lastTime = currentTime;

    // 将视频帧绘制到隐藏的canvas上
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 从隐藏canvas获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 创建一个新的ImageData对象用于显示
    const displayData = new ImageData(canvas.width, canvas.height);

    // 应用变形效果
    if (currentDistortion !== "none") {
      applyDistortionEffect(
        imageData,
        displayData,
        distortionEffects[currentDistortion]
      );
    } else {
      // 如果没有变形效果，直接复制像素数据
      displayData.data.set(imageData.data);
    }

    // 将处理后的图像绘制到显示canvas
    displayCtx.putImageData(displayData, 0, 0);

    // 应用心情滤镜（通过CSS类）
    if (currentMood) {
      displayCanvas.className = moodElements[currentMood].filterClass;
    }

    // 继续渲染下一帧
    requestAnimationFrame(renderFrame);
  }

  // 凸起效果实现
  function bulgeEffect(srcX, srcY, width, height, strength) {
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

  // 凹陷效果实现
  function pinchEffect(srcX, srcY, width, height, strength) {
    return bulgeEffect(srcX, srcY, width, height, -strength);
  }

  // 波浪效果实现
  function waveEffect(srcX, srcY, width, height, strength, frequency) {
    return {
      x: srcX + Math.sin(srcY * frequency) * strength,
      y: srcY + Math.sin(srcX * frequency) * strength,
    };
  }

  // 鱼眼效果实现
  function fisheyeEffect(srcX, srcY, width, height, strength) {
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
  function twistEffect(srcX, srcY, width, height, strength) {
    const centerX = width / 2;
    const centerY = height / 2;

    const dx = srcX - centerX;
    const dy = srcY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 角度随距离变化
    const angle = strength * distance;

    // 旋转变换
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);

    return {
      x: centerX + dx * cosAngle - dy * sinAngle,
      y: centerY + dx * sinAngle + dy * cosAngle,
    };
  }

  // 应用变形效果到像素数据
  function applyDistortionEffect(sourceData, targetData, effectConfig) {
    const { width, height } = sourceData;
    const { effect, strength } = effectConfig;

    // 遍历目标图像的每个像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // 计算源图像中的对应像素位置
        const result = effect(
          x,
          y,
          width,
          height,
          strength,
          effectConfig.frequency
        );
        const srcX = Math.floor(result.x);
        const srcY = Math.floor(result.y);

        // 检查边界
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
          // 复制源像素到目标像素
          const targetIndex = (y * width + x) * 4;
          const sourceIndex = (srcY * width + srcX) * 4;

          targetData.data[targetIndex] = sourceData.data[sourceIndex];
          targetData.data[targetIndex + 1] = sourceData.data[sourceIndex + 1];
          targetData.data[targetIndex + 2] = sourceData.data[sourceIndex + 2];
          targetData.data[targetIndex + 3] = sourceData.data[sourceIndex + 3];
        }
      }
    }
  }

  // 初始化应用
  startCamera();

  // 默认选择无变形效果
  document
    .querySelector('.distortion-btn[data-effect="none"]')
    .classList.add("active");

  // 监听心情按钮点击事件
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 移除所有按钮的active类
      moodButtons.forEach((b) => b.classList.remove("active"));

      // 为当前按钮添加active类
      btn.classList.add("active");

      // 更新当前心情
      currentMood = btn.dataset.mood;

      // 移除之前的滤镜类（仅背景）
      captureOverlay.className = "";
      document.body.className = "";

      // 添加新的滤镜类（仅背景）
      if (currentMood && moodElements[currentMood]) {
        captureOverlay.classList.add(moodElements[currentMood].bgClass);
        document.body.classList.add(moodElements[currentMood].bgClass);

        // 根据不同心情设置表情位置
        switch (currentMood) {
          case "happy":
            addMoodDecorations("happy");
            break;
          case "sad":
            addMoodDecorations("sad");
            break;
          case "angry":
            addMoodDecorations("angry");
            break;
          case "surprised":
            addMoodDecorations("surprised");
            break;
          case "cool":
            addMoodDecorations("cool");
            break;
          case "love":
            addMoodDecorations("love");
            break;
        }
      }
    });
  });

  // 监听变形效果按钮点击事件
  distortionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 移除所有按钮的active类
      distortionButtons.forEach((b) => b.classList.remove("active"));

      // 为当前按钮添加active类
      btn.classList.add("active");

      // 更新当前变形效果
      currentDistortion = btn.dataset.effect;
    });
  });

  // 添加心情装饰
  function addMoodDecorations(mood) {
    // 清除现有装饰
    captureOverlay.innerHTML = "";

    const moodInfo = moodElements[mood];

    // 添加不同的心情装饰效果
    switch (mood) {
      case "happy":
        addEmojis("😊", 5, "random", "30px");
        addEmojis("🌞", 3, "top", "40px");
        break;
      case "sad":
        addEmojis("💧", 8, "top", "25px");
        addEmojis("🌧️", 2, "top", "40px");
        break;
      case "angry":
        addEmojis("💢", 4, "random", "35px");
        addEmojis("🔥", 3, "bottom", "30px");
        break;
      case "surprised":
        addEmojis("⭐", 7, "random", "25px");
        addEmojis("❗", 2, "side", "45px");
        break;
      case "cool":
        addEmojis("🕶️", 1, "center", "70px");
        addEmojis("✨", 8, "random", "20px");
        break;
      case "love":
        addEmojis("❤️", 8, "random", "20px");
        addEmojis("💕", 4, "side", "25px");
        break;
    }
  }

  // 添加表情装饰
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
    tempCtx.fillStyle = moodElements[currentMood].color;
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 将最终结果设置为图像源
    resultImage.src = tempCanvas.toDataURL("image/png");

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
    img.onload = function () {
      // 绘制图像
      finalCtx.drawImage(img, 0, 0);

      // 创建下载链接
      const link = document.createElement("a");
      link.download = `我的${moodElements[currentMood].emoji}心情照片${
        currentDistortion !== "none" ? `_${currentDistortion}` : ""
      }.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
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

    // 重置变形效果选择为无变形
    distortionButtons.forEach((btn) => btn.classList.remove("active"));
    document
      .querySelector('.distortion-btn[data-effect="none"]')
      .classList.add("active");
    currentDistortion = "none";

    // 清除所有滤镜类
    displayCanvas.className = "";
    captureOverlay.className = "";
    document.body.className = "";

    // 清除装饰
    captureOverlay.innerHTML = "";

    // 禁用下载按钮
    downloadBtn.disabled = true;
  });
});
