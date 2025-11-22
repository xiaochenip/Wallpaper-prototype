
class WallpaperMockupGenerator {
    constructor() {
        this.canvas = new fabric.Canvas('previewCanvas');
        this.currentTemplate = null;
        this.userImages = [];
        this.userImage = null;
        this.currentWallpaper = null;
        this.deviceLayer = null;
        this.currentImageIndex = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTemplates();
        this.setCanvasSize();
    }
    
    setupEventListeners() {
        // 文件上传
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageUpload');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#3498db';
            uploadArea.style.backgroundColor = '#e3f2fd';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ccc';
            uploadArea.style.backgroundColor = '';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            uploadArea.style.backgroundColor = '';
            
            const files = Array.from(e.dataTransfer.files).filter(file => file.type.match('image.*'));
            if (files.length > 0) {
                this.handleMultipleImageUpload(files);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).filter(file => file.type.match('image.*'));
            if (files.length > 0) {
                this.handleMultipleImageUpload(files);
            }
        });
        
        // 清空图片按钮
        document.getElementById('clearImages').addEventListener('click', () => {
            this.clearAllImages();
        });
        
        // 继续上传按钮
        document.getElementById('continueUpload').addEventListener('click', () => {
            document.getElementById('imageUpload').click();
        });
        
        // 设置控制
        document.getElementById('bgColor').addEventListener('change', (e) => {
            this.setBackgroundColor(e.target.value);
        });
        
        document.getElementById('scaleSlider').addEventListener('input', (e) => {
            if (this.userImage) {
                this.scaleUserImage(parseInt(e.target.value) / 100);
            }
        });
        
        // 下载按钮
        document.getElementById('downloadBtn').addEventListener('click', () => {
            this.downloadMockup();
        });
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.setCanvasSize());
    }
    
    loadTemplates() {
        const templates = [
            { id: 'ios26', name: 'iOS 26', image: 'assets/images/templates/IOS26.png', screen: { x: 60, y: 140, width: 270, height: 585 } },
            { id: 'lsdp', name: '桌面+锁屏', image: 'assets/images/templates/Lsdp.png', screen: { x: 55, y: 135, width: 280, height: 590 } },
            { id: 'iPad-Pro', name: 'iPad Pro', image: 'ass1ets/images/templates/iPad Pro.png', screen: { x: 80, y: 120, width: 640, height: 480 } },
            { id: 'imac-pro', name: 'iMac Pro', image: 'asse1ts/images/templates/iMac Pro.png', screen: { x: 180, y: 95, width: 900, height: 560 } }
        ];
        
        const templateGrid = document.getElementById('templateGrid');
        templates.forEach((template, index) => {
            const templateElement = document.createElement('div');
            templateElement.className = 'template-item';
            templateElement.innerHTML = `
                <img src="${template.image}" alt="${template.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjBGMEYwIi8+CjxwYXRoIGQ9Ik0zMCAzN0MzMy44NjYgMzcgMzcgMzMuODY2IDM3IDMwQzM3IDI2LjEzNCAzMy44NjYgMjMgMzAgMjNDMjYuMTM0IDIzIDIzIDI2LjEzNCAyMyAzMEMyMyAzMy44NjYgMjYuMTM0IDM3IDMwIDM3WiIgZmlsbD0iI0NDQyIvPgo8cGF0aCBkPSJNMTggMTdINDJWNDNIMThWMTdaTTE5IDE5VjMwTDI0IDI1TDMwIDMxTDM2IDI1TDQxIDMwVjE5SDE5WiIgZmlsbD0iI0NDQyIvPgo8L3N2Zz4K'">
                <div>${template.name}</div>
            `;
            
            templateElement.addEventListener('click', () => {
                document.querySelectorAll('.template-item').forEach(item => {
                    item.classList.remove('active');
                });
                templateElement.classList.add('active');
                this.loadTemplate(template);
                document.getElementById('deviceName').textContent = template.name;
            });
            
            templateGrid.appendChild(templateElement);
            
            // 默认选择第一个模板（iOS 26）
            if (index === 0) {
                templateElement.classList.add('active');
                this.loadTemplate(template);
                document.getElementById('deviceName').textContent = template.name;
            }
        });
    }
    
    async loadTemplate(template) {
        this.currentTemplate = template;
        
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(template.image, (img) => {
                // 清除画布
                this.canvas.clear();
                
                // 设置固定画布大小为600x800（3:4比例）
                this.canvas.setWidth(600);
                this.canvas.setHeight(800);
                
                // 计算缩放比例以适应画布
                const scaleX = 600 / img.width;
                const scaleY = 800 / img.height;
                const scale = Math.min(scaleX, scaleY);
                
                // 缩放并居中设备模板
                img.scale(scale);
                img.set({
                    left: (600 - img.width * scale) / 2,
                    top: (800 - img.height * scale) / 2,
                    selectable: false,
                    evented: false
                });
                
                // 添加设备模板
                this.deviceLayer = img;
                this.canvas.add(this.deviceLayer);
                
                // 如果有用户图片，重新应用
                if (this.userImage) {
                    this.applyUserImageToTemplate();
                }
                
                resolve();
            }, {
                crossOrigin: 'anonymous'
            });
        });
    }
    
    handleMultipleImageUpload(files) {
        const validFiles = files.filter(file => file.type.match('image.*'));
        
        if (validFiles.length === 0) {
            alert('请上传图片文件！');
            return;
        }
        
        // 检查是否为首次上传（用于决定是否清空现有图片）
        const isFirstUpload = this.userImages.length === 0;
        let loadedCount = 0;
        
        // 处理每个文件
        validFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                // 保存图片数据
                this.userImages.push({
                    src: e.target.result,
                    name: file.name,
                    file: file
                });
                
                loadedCount++;
                
                // 等待所有图片都加载完成后再更新UI
                if (loadedCount === validFiles.length) {
                    this.updateThumbnailsDisplay();
                    if (isFirstUpload) {
                        this.loadFirstImage();
                    }
                }
            };
            reader.readAsDataURL(file);
        });
    }
    
    updateThumbnailsDisplay() {
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const uploadThumbnails = document.getElementById('uploadThumbnails');
        const imageCounter = document.getElementById('imageCounter');
        const imageCount = document.getElementById('imageCount');
        
        if (this.userImages.length === 0) {
            uploadPlaceholder.style.display = 'flex';
            uploadThumbnails.style.display = 'none';
            imageCounter.style.display = 'none';
            return;
        }
        
        // 隐藏占位符，显示缩略图容器
        uploadPlaceholder.style.display = 'none';
        uploadThumbnails.style.display = 'grid';
        imageCounter.style.display = 'flex';
        
        // 更新图片计数
        imageCount.textContent = this.userImages.length;
        
        // 清空现有缩略图
        uploadThumbnails.innerHTML = '';
        
        // 创建缩略图
        this.userImages.forEach((image, index) => {
            const thumbnailItem = document.createElement('div');
            thumbnailItem.className = 'thumbnail-item';
            if (index === this.currentImageIndex) {
                thumbnailItem.classList.add('active');
            }
            
            thumbnailItem.innerHTML = `
                <img src="${image.src}" alt="${image.name}">
                <button class="thumbnail-remove" data-index="${index}">×</button>
            `;
            
            // 点击缩略图切换图片
            thumbnailItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!e.target.classList.contains('thumbnail-remove')) {
                    this.switchToImage(index);
                }
            });
            
            // 删除按钮
            const removeBtn = thumbnailItem.querySelector('.thumbnail-remove');
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeImage(index);
            });
            
            uploadThumbnails.appendChild(thumbnailItem);
        });
    }
    
    loadFirstImage() {
        if (this.userImages.length > 0) {
            this.currentImageIndex = 0;
            this.loadImageByIndex(0);
        }
    }
    
    loadImageByIndex(index) {
        if (index < 0 || index >= this.userImages.length) return;
        
        const imageData = this.userImages[index];
        fabric.Image.fromURL(imageData.src, (img) => {
            this.userImage = img;
            this.applyUserImageToTemplate();
        });
    }
    
    switchToImage(index) {
        this.currentImageIndex = index;
        this.loadImageByIndex(index);
        
        // 更新缩略图选中状态
        document.querySelectorAll('.thumbnail-item').forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    removeImage(index) {
        this.userImages.splice(index, 1);
        
        // 调整当前索引
        if (this.currentImageIndex >= this.userImages.length) {
            this.currentImageIndex = this.userImages.length - 1;
        }
        
        // 更新显示
        this.updateThumbnailsDisplay();
        
        // 如果还有图片，加载当前选中的图片
        if (this.userImages.length > 0) {
            this.loadImageByIndex(this.currentImageIndex);
        } else {
            // 清空画布上的壁纸
            this.clearWallpaperFromCanvas();
        }
    }
    
    clearAllImages() {
        this.userImages = [];
        this.currentImageIndex = 0;
        this.updateThumbnailsDisplay();
        this.clearWallpaperFromCanvas();
    }
    
    clearWallpaperFromCanvas() {
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj !== this.deviceLayer) {
                this.canvas.remove(obj);
            }
        });
        this.currentWallpaper = null;
        this.canvas.renderAll();
    }
    
    applyUserImageToTemplate() {
        if (!this.currentTemplate || !this.userImage) return;
        
        // 移除可能存在的旧壁纸
        const objects = this.canvas.getObjects();
        objects.forEach(obj => {
            if (obj !== this.deviceLayer) {
                this.canvas.remove(obj);
            }
        });
        
        // 克隆用户图片
        const wallpaper = this.userImage.clone(clone => {
            // 获取设备模板的缩放比例和偏移
            const deviceScale = this.deviceLayer.scaleX || 1;
            const deviceLeft = this.deviceLayer.left || 0;
            const deviceTop = this.deviceLayer.top || 0;
            
            // 设置壁纸位置和大小以匹配设备屏幕（考虑缩放和偏移）
            const screen = this.currentTemplate.screen;
            clone.set({
                left: deviceLeft + screen.x * deviceScale,
                top: deviceTop + screen.y * deviceScale,
                width: screen.width * deviceScale,
                height: screen.height * deviceScale,
                selectable: false,
                evented: false
            });

            // 将壁纸置于设备层下方
            if (clone) {
                this.currentWallpaper = clone;
                this.canvas.insertAt(clone, 0);
                this.canvas.renderAll();
            }
        });
    }
    
    scaleUserImage(scale) {
        if (!this.currentWallpaper || !this.currentTemplate) return;

        // 获取设备模板的缩放比例和偏移
        const deviceScale = this.deviceLayer.scaleX || 1;
        const deviceLeft = this.deviceLayer.left || 0;
        const deviceTop = this.deviceLayer.top || 0;
        
        // 重新计算壁纸位置和大小
        const screen = this.currentTemplate.screen;
        const baseWidth = screen.width * deviceScale;
        const baseHeight = screen.height * deviceScale;
        const baseLeft = deviceLeft + screen.x * deviceScale;
        const baseTop = deviceTop + screen.y * deviceScale;
        
        // 应用缩放
        this.currentWallpaper.set({
            left: baseLeft,
            top: baseTop,
            scaleX: scale,
            scaleY: scale,
            width: baseWidth,
            height: baseHeight
        });
        
        this.canvas.renderAll();
    }
    
    setBackgroundColor(color) {
        this.canvas.setBackgroundColor(color, () => {
            this.canvas.renderAll();
        });
    }
    
    setCanvasSize() {
        // 保持固定画布大小600x800（3:4比例）
        if (this.canvas) {
            this.canvas.setDimensions({
                width: 600,
                height: 800
            });
        }
    }
    
    downloadMockup() {
        if (!this.currentTemplate) {
            alert('请先选择设备模板！');
            return;
        }
        
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            quality: 1
        });
        
        const link = document.createElement('a');
        link.download = `wallpaper-mockup-${this.currentTemplate.id}-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new WallpaperMockupGenerator();
});