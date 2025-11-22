const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));
app.use('/uploads', express.static('uploads'));

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  }
});

// API路由
app.get('/api/templates', (req, res) => {
  const templates = require('./templates/devices.json');
  res.json(templates);
});

app.post('/api/generate-mockup', upload.single('wallpaper'), async (req, res) => {
  try {
    const { templateId, settings } = req.body;
    const wallpaperPath = req.file.path;
    
    // 加载模板配置
    const templates = require('./templates/devices.json');
    const template = templates.devices.find(d => d.id === templateId);
    
    if (!template) {
      return res.status(404).json({ error: '模板未找到' });
    }
    
    // 使用sharp处理图片
    const templatePath = path.join(__dirname, template.image);
    const outputPath = `uploads/mockup-${Date.now()}.png`;
    
    await sharp(templatePath)
      .composite([{
        input: wallpaperPath,
        top: template.screen.y,
        left: template.screen.x,
        blend: 'over'
      }])
      .png()
      .toFile(outputPath);
    
    // 返回生成的样机图片URL
    res.json({ 
      success: true, 
      url: `/uploads/${path.basename(outputPath)}` 
    });
    
    // 清理临时文件（可选）
    setTimeout(() => {
      fs.unlinkSync(wallpaperPath);
      fs.unlinkSync(outputPath);
    }, 60000); // 1分钟后删除
    
  } catch (error) {
    console.error('生成失败:', error);
    res.status(500).json({ error: '生成失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});