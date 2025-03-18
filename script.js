document.addEventListener("DOMContentLoaded", () => {
  // 获取DOM元素
  const video = document.getElementById("camera");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const captureBtn = document.getElementById("capture-btn");
  const downloadBtn = document.getElementById("download-btn");
  const resetBtn = document.getElementById("reset-btn");
  const resultImage = document.getElementById("result-image");
  const resultContainer = document.querySelector(".result-container");
  const moodButtons = document.querySelectorAll(".mood-btn");
  const captureOverlay = document.getElementById("capture-overlay");

  // 当前选中的心情
  let currentMood = "";

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
      });
    } catch (err) {
      console.error("相机访问出错:", err);
      alert(
        "无法访问相机。请确保您已授予相机访问权限，并且您的设备有可用的相机。"
      );
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

      // 移除之前的滤镜类
      video.className = "";
      captureOverlay.className = "";
      document.body.className = "";

      // 添加新的滤镜类
      if (currentMood && moodElements[currentMood]) {
        video.classList.add(moodElements[currentMood].filterClass);
        captureOverlay.classList.add(moodElements[currentMood].bgClass);
        document.body.classList.add(moodElements[currentMood].bgClass);

        // 添加表情符号
        const moodEmoji = document.createElement("div");
        moodEmoji.style.position = "absolute";
        moodEmoji.style.fontSize = "50px";
        moodEmoji.style.zIndex = "10";

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

    // 显示canvas
    canvas.style.display = "block";

    // 将视频帧绘制到canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 应用滤镜效果（通过CSS）
    const dataURL = canvas.toDataURL("image/png");
    resultImage.src = dataURL;

    // 显示结果容器
    resultContainer.style.display = "block";

    // 启用下载按钮
    downloadBtn.disabled = false;

    // 创建装饰层副本
    const decorations = captureOverlay.innerHTML;

    // 创建一个临时的canvas用于合成最终图像
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    // 绘制原始图像
    const img = new Image();
    img.onload = function () {
      // 绘制图像
      tempCtx.drawImage(img, 0, 0);

      // 应用滤镜效果
      tempCtx.filter = getComputedStyle(video).filter;
      tempCtx.globalCompositeOperation = "source-atop";
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      // 重置合成操作
      tempCtx.globalCompositeOperation = "source-over";

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
      const oldDecorations = resultContainer.querySelector(
        ".result-decorations"
      );
      if (oldDecorations) {
        resultContainer.removeChild(oldDecorations);
      }

      // 添加新的装饰
      decorationContainer.className = "result-decorations";
      resultContainer.appendChild(decorationContainer);
    };
    img.src = dataURL;
  });

  // 下载按钮点击事件
  downloadBtn.addEventListener("click", () => {
    if (!resultImage.src) return;

    // 创建一个包含装饰和滤镜的合成canvas
    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = canvas.width;
    finalCanvas.height = canvas.height;
    const finalCtx = finalCanvas.getContext("2d");

    // 加载图像
    const img = new Image();
    img.onload = function () {
      // 绘制图像
      finalCtx.drawImage(img, 0, 0);

      // 创建下载链接
      const link = document.createElement("a");
      link.download = `我的${moodElements[currentMood].emoji}心情照片.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
    };
    img.src = resultImage.src;
  });

  // 重置按钮点击事件
  resetBtn.addEventListener("click", () => {
    // 隐藏结果容器
    resultContainer.style.display = "none";

    // 隐藏canvas
    canvas.style.display = "none";

    // 重置心情选择
    moodButtons.forEach((btn) => btn.classList.remove("active"));
    currentMood = "";

    // 清除所有滤镜类
    video.className = "";
    captureOverlay.className = "";
    document.body.className = "";

    // 清除装饰
    captureOverlay.innerHTML = "";

    // 禁用下载按钮
    downloadBtn.disabled = true;
  });
});
