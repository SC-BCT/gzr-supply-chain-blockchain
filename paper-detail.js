// paper-detail.js - 简化修复版
// 全局变量
let isLoggedIn = false;
let currentEditData = null;
let currentPaperId = null;

// 检查DOM元素是否存在
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`元素 ${id} 不存在`);
    }
    return element;
}

// 页面初始化
async function initializePage() {
    console.log('开始初始化论文详情页');
    
    // 检查登录状态
    isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    console.log('登录状态:', isLoggedIn);
    
    // 获取URL参数中的论文ID
    const urlParams = new URLSearchParams(window.location.search);
    currentPaperId = urlParams.get('id');
    if (!currentPaperId) {
        currentPaperId = '1'; // 默认ID
    }
    console.log('当前论文ID:', currentPaperId);
    
    try {
        // 加载论文基本信息
        await loadPaperBasicInfo();
        
        // 加载论文详情数据
        await loadPaperDetails();
        
        // 更新UI
        updateUI();
        
    } catch (error) {
        console.error('初始化失败:', error);
        showNotification('页面初始化失败，请刷新重试', 'error');
    }
}

// 加载论文基本信息
async function loadPaperBasicInfo() {
    console.log('开始加载论文基本信息');
    
    try {
        // 尝试从data.json加载
        const response = await fetch('data.json');
        if (response.ok) {
            const jsonData = await response.json();
            console.log('从data.json加载的数据:', jsonData);
            
            let papers = [];
            if (jsonData.papers) {
                papers = jsonData.papers;
            } else if (jsonData.projectData) {
                papers = jsonData.projectData.papers || [];
            }
            
            const paper = papers.find(p => p.id.toString() === currentPaperId.toString());
            if (paper) {
                console.log('找到论文基本信息:', paper);
                renderPaperBasicInfo(paper);
                return;
            }
        }
    } catch (error) {
        console.log('从data.json加载失败:', error);
    }
    
    // 显示默认信息
    console.warn('未找到论文基本信息');
    renderPaperBasicInfo({
        title: `论文 #${currentPaperId}`,
        journal: '',
        time: '',
        authors: ''
    });
}

// 渲染论文基本信息
function renderPaperBasicInfo(paper) {
    const titleElement = getElement('paperTitle');
    const journalElement = getElement('paperJournal');
    const timeElement = getElement('paperTime');
    const authorsElement = getElement('paperAuthors');
    
    if (titleElement) titleElement.textContent = paper.title || `论文 #${currentPaperId}`;
    if (journalElement) journalElement.textContent = paper.journal || '';
    if (timeElement) timeElement.textContent = paper.time || '';
    if (authorsElement) authorsElement.textContent = paper.authors || '';
}

// 加载论文详情数据 - 简化修复版
async function loadPaperDetails() {
    console.log(`开始加载论文${currentPaperId}的详情数据`);
    
    let paperDetails = null;
    
    // 1. 从paperDetails.json加载（主加载方式）
    try {
        console.log('尝试从paperDetails.json加载...');
        const response = await fetch('paperDetails.json');
        if (response.ok) {
            const jsonData = await response.json();
            console.log('从paperDetails.json加载的数据:', jsonData);
            
            // 检查数据格式
            if (jsonData && typeof jsonData === 'object') {
                // 格式1: { "1": {...}, "2": {...} } (main.js导出的格式)
                if (jsonData[currentPaperId]) {
                    paperDetails = jsonData[currentPaperId];
                    console.log(`找到论文${currentPaperId}的详情:`, paperDetails);
                } 
                // 格式2: [{paperId: 1, ...}, {paperId: 2, ...}]
                else if (Array.isArray(jsonData)) {
                    console.log('数据是数组格式，搜索论文ID:', currentPaperId);
                    const item = jsonData.find(item => {
                        const id = item.paperId || item.id;
                        return id && id.toString() === currentPaperId.toString();
                    });
                    
                    if (item) {
                        paperDetails = item;
                        console.log(`从数组找到论文${currentPaperId}的详情:`, paperDetails);
                    }
                }
            }
        }
    } catch (error) {
        console.log('从paperDetails.json加载失败:', error);
    }
    
    // 2. 从localStorage加载（备用）
    if (!paperDetails) {
        try {
            const paperDetailsData = localStorage.getItem('paperDetails');
            if (paperDetailsData) {
                const parsedData = JSON.parse(paperDetailsData);
                if (parsedData[currentPaperId]) {
                    paperDetails = parsedData[currentPaperId];
                    console.log(`从localStorage找到论文${currentPaperId}的详情:`, paperDetails);
                }
            }
        } catch (error) {
            console.log('从localStorage加载失败:', error);
        }
    }
    
    // 3. 创建默认数据
    if (!paperDetails) {
        console.log(`为论文${currentPaperId}创建默认详情数据`);
        paperDetails = {
            backgroundContent: '请添加研究背景信息',
            mainContent: '请添加研究内容信息',
            conclusionContent: '请添加研究结论信息',
            linkContent: '暂无全文链接',
            homepageImages: [],
            keyImages: []
        };
    }
    
    // 确保数据结构完整
    const completePaperDetails = {
        backgroundContent: paperDetails.backgroundContent || '请添加研究背景信息',
        mainContent: paperDetails.mainContent || '请添加研究内容信息',
        conclusionContent: paperDetails.conclusionContent || '请添加研究结论信息',
        linkContent: paperDetails.linkContent || '暂无全文链接',
        homepageImages: paperDetails.homepageImages || [],
        keyImages: paperDetails.keyImages || []
    };
    
    console.log(`最终渲染的论文详情:`, completePaperDetails);
    renderPaperDetails(completePaperDetails);
}

// 渲染论文详情
function renderPaperDetails(paperDetails) {
    console.log('渲染论文详情:', paperDetails);
    
    // 渲染文字内容
    const backgroundElement = getElement('backgroundContent');
    const mainElement = getElement('mainContent');
    const conclusionElement = getElement('conclusionContent');
    const linkElement = getElement('linkContent');
    
    if (backgroundElement) {
        backgroundElement.innerHTML = formatTextWithParagraphs(paperDetails.backgroundContent);
    }
    if (mainElement) {
        mainElement.innerHTML = formatTextWithParagraphs(paperDetails.mainContent);
    }
    if (conclusionElement) {
        conclusionElement.innerHTML = formatTextWithParagraphs(paperDetails.conclusionContent);
    }
    if (linkElement) {
        linkElement.innerHTML = formatLinkContent(paperDetails.linkContent);
    }
    
    // 渲染图片
    renderImages('homepageImages', paperDetails.homepageImages);
    renderImages('keyImages', paperDetails.keyImages);
}

// 格式化文本为段落
function formatTextWithParagraphs(text) {
    if (!text || text.trim() === '' || text === '请添加研究背景信息' || text === '请添加研究内容信息' || text === '请添加研究结论信息') {
        return '<p class="text-gray-500 italic">暂无内容</p>';
    }
    
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    
    if (paragraphs.length === 0) {
        return '<p class="text-gray-500 italic">暂无内容</p>';
    }
    
    return paragraphs.map(paragraph => 
        `<p class="paragraph-content">${paragraph.trim()}</p>`
    ).join('');
}

// 格式化链接
function formatLinkContent(content) {
    if (!content || content.trim() === '' || content === '请添加全文链接' || content === '暂无全文链接') {
        return '暂无全文链接';
    }
    
    content = content.trim();
    
    // 检查是否为URL
    const isUrl = content.startsWith('http://') || content.startsWith('https://');
    
    if (isUrl) {
        return `<a href="${content}" target="_blank" class="text-blue-600 hover:text-blue-800 underline break-all">${content}</a>`;
    }
    
    return content;
}

// 渲染图片
function renderImages(containerId, images) {
    const container = getElement(containerId);
    if (!container) {
        console.error(`找不到容器: ${containerId}`);
        return;
    }
    
    if (!images || images.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">暂无图片</p>';
        return;
    }
    
    console.log(`渲染图片到 ${containerId}:`, images.length, '张');
    
    container.innerHTML = images.map((image, index) => {
        let imageUrl = image;
        
        return `
        <div class="image-item bg-gray-100 rounded-lg overflow-hidden relative group mb-4">
            <img src="${imageUrl}" alt="论文图片" 
                 class="w-full h-auto cursor-pointer"
                 onclick="openImageModal('${imageUrl.replace(/'/g, "\\'")}')">
        </div>
    `}).join('');
}

// 打开图片模态框
function openImageModal(imageSrc) {
    const imageModal = getElement('imageModal');
    const modalImage = getElement('modalImage');
    
    if (modalImage) {
        modalImage.src = imageSrc;
    }
    if (imageModal) {
        imageModal.classList.add('show');
    }
}

// 关闭图片模态框
function closeImageModal() {
    const imageModal = getElement('imageModal');
    if (imageModal) {
        imageModal.classList.remove('show');
    }
}

// 更新UI
function updateUI() {
    console.log('更新UI，登录状态:', isLoggedIn);
    
    const editBtns = document.querySelectorAll('.edit-btn');
    const addHomepageBtn = getElement('addHomepageBtn');
    const addKeyBtn = getElement('addKeyBtn');
    
    if (isLoggedIn) {
        editBtns.forEach(btn => btn.classList.remove('hidden'));
        if (addHomepageBtn) addHomepageBtn.classList.remove('hidden');
        if (addKeyBtn) addKeyBtn.classList.remove('hidden');
    } else {
        editBtns.forEach(btn => btn.classList.add('hidden'));
        if (addHomepageBtn) addHomepageBtn.classList.add('hidden');
        if (addKeyBtn) addKeyBtn.classList.add('hidden');
    }
}

// 显示通知
function showNotification(message, type = 'info') {
    console.log(`通知: ${message} (${type})`);
    // 简化通知实现
    alert(message);
}

// 页面加载完成事件
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化...');
    initializePage();
});

// 导出全局函数
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
