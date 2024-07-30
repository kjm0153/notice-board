const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// EJS 템플릿 파일 경로
const templatePath = path.join(__dirname, 'views', 'index.ejs');

// 출력 디렉토리
const outputDir = path.join(__dirname, 'build');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// EJS 템플릿을 렌더링하여 HTML로 저장
ejs.renderFile(templatePath, {}, (err, str) => {
  if (err) {
    console.error('Error rendering EJS template:', err);
    process.exit(1);
  }
  fs.writeFileSync(path.join(outputDir, 'index.html'), str);
  console.log('Build complete');
});