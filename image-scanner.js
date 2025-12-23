// 图片扫描器 - 自动扫描images文件夹中的图片
class ImageScanner {
    constructor() {
        this.scannedImages = new Map();
        this.paperImageMap = new Map();
        this.isScanning = false;
    }
    
    // 扫描图片文件
    async scanImages() {
        if (this.isScanning) return this.scannedImages;
        
        this.isScanning = true;
        try {
            console.log('开始扫描图片...');
            
            // 扫描 homepage 文件夹
            await this.scanFolder('images/homepage');
            // 扫描 key 文件夹
            await this.scanFolder('images/key');
            // 扫描 papers 文件夹（按论文ID分类）
            await this.scanPaperFolders();
            
            console.log('图片扫描完成', this.scannedImages);
            return this.scannedImages;
        } catch (error) {
            console.error('扫描图片失败:', error);
            return new Map();
        } finally {
            this.isScanning = false;
        }
    }
    
    // 扫描指定文件夹
    async scanFolder(folderPath) {
        try {
            // 尝试读取文件夹内容
            const response = await fetch(folderPath);
            if (response.ok) {
                const text = await response.text();
                // 解析简单的目录列表
                const imageFiles = this.parseDirectoryListing(text, folderPath);
                
                this.scannedImages.set(folderPath, imageFiles);
                console.log(`扫描文件夹 ${folderPath}: 找到 ${imageFiles.length} 张图片`);
            } else {
                console.warn(`无法访问文件夹 ${folderPath}: ${response.status}`);
            }
        } catch (error) {
            console.warn(`扫描文件夹 ${folderPath} 失败:`, error);
        }
    }
    
    // 扫描论文分类文件夹
    async scanPaperFolders() {
        try {
            const response = await fetch('images/papers/');
            if (response.ok) {
                const text = await response.text();
                // 获取所有论文ID文件夹
                const paperFolders = this.parsePaperFolders(text);
                
                console.log(`找到 ${paperFolders.length} 个论文文件夹:`, paperFolders);
                
                for (const paperId of paperFolders) {
                    await this.scanPaperFolder(paperId);
                }
            } else {
                console.warn('无法访问papers文件夹:', response.status);
            }
        } catch (error) {
            console.warn('扫描papers文件夹失败:', error);
        }
    }
    
    // 扫描单个论文文件夹
    async scanPaperFolder(paperId) {
        // 扫描 homepage 子文件夹
        await this.scanFolder(`images/papers/${paperId}/homepage`);
        // 扫描 key 子文件夹
        await this.scanFolder(`images/papers/${paperId}/key`);
    }
    
    // 解析目录列表
    parseDirectoryListing(html, folderPath) {
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
        const images = [];
        
        try {
            // 创建临时DOM来解析HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // 查找所有链接
            const links = doc.querySelectorAll('a');
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href !== '../') {
                    const lowerHref = href.toLowerCase();
                    // 检查是否是图片文件
                    if (imageExtensions.some(ext => lowerHref.endsWith(ext))) {
                        // 构建完整的图片URL
                        const imageUrl = href.startsWith('http') ? href : `${folderPath}/${href}`;
                        images.push(imageUrl);
                    }
                }
            });
        } catch (error) {
            console.warn('解析目录列表失败:', error);
        }
        
        return images;
    }
    
    // 解析论文文件夹
    parsePaperFolders(html) {
        const folders = [];
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.endsWith('/') && href !== '../') {
                    // 提取论文ID
                    const match = href.match(/^(\d+)\/$/);
                    if (match) {
                        const paperId = parseInt(match[1]);
                        if (!isNaN(paperId)) {
                            folders.push(paperId);
                        }
                    }
                }
            });
        } catch (error) {
            console.warn('解析论文文件夹失败:', error);
        }
        
        return folders;
    }
    
    // 获取指定论文的图片
    getPaperImages(paperId, type = 'homepage') {
        const key = `images/papers/${paperId}/${type}`;
        return this.scannedImages.get(key) || [];
    }
    
    // 获取通用图片
    getCommonImages(type = 'homepage') {
        const key = `images/${type}`;
        return this.scannedImages.get(key) || [];
    }
    
    // 检查论文是否有图片
    hasPaperImages(paperId) {
        const homepage = this.getPaperImages(paperId, 'homepage');
        const key = this.getPaperImages(paperId, 'key');
        return homepage.length > 0 || key.length > 0;
    }
}

// 全局图片扫描器实例
window.imageScanner = new ImageScanner();

// 在页面加载完成后扫描图片
document.addEventListener('DOMContentLoaded', function() {
    // 延迟扫描，确保页面先加载
    setTimeout(() => {
        window.imageScanner.scanImages().then(() => {
            console.log('图片扫描完成');
        });
    }, 1000);
});