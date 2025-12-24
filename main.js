// 从IndexedDB获取所有论文详情数据
async function getAllPaperDetailsFromIndexedDB() {
    if (!db) {
        try {
            await initIndexedDB();
        } catch (error) {
            console.log('IndexedDB初始化失败，将使用localStorage:', error);
            return {};
        }
    }
    
    return new Promise((resolve, reject) => {
        try {
            const transaction = db.transaction(['paperDetails'], 'readonly');
            const objectStore = transaction.objectStore('paperDetails');
            const request = objectStore.getAll();
            
            request.onsuccess = function(event) {
                const allPaperDetails = {};
                event.target.result.forEach(item => {
                    // 重要：检查数据结构，提取正确的数据
                    if (item.paperId) {
                        // 在paper-detail.js中，数据存储在item对象本身，而不是item.data
                        // 我们需要提取所有相关字段
                        allPaperDetails[item.paperId] = {
                            backgroundContent: item.backgroundContent || '暂无研究背景信息',
                            mainContent: item.mainContent || '暂无研究内容信息',
                            conclusionContent: item.conclusionContent || '暂无研究结论信息',
                            linkContent: item.linkContent || '暂无全文链接',
                            homepageImages: item.homepageImages || [],
                            keyImages: item.keyImages || []
                        };
                    }
                });
                resolve(allPaperDetails);
            };
            
            request.onerror = function(event) {
                console.error('从IndexedDB获取数据失败:', event.target.error);
                resolve({});
            };
        } catch (error) {
            console.error('IndexedDB操作异常:', error);
            resolve({});
        }
    });
}

// 检查并确保从localStorage获取的数据包含完整的结构
function getPaperDetailsFromLocalStorage() {
    try {
        const paperDetails = DataManager.load('paperDetails', {});
        console.log('从localStorage获取到论文详情数据:', Object.keys(paperDetails).length, '篇');
        
        // 确保每个论文详情都有完整的结构
        const completePaperDetails = {};
        for (const paperId in paperDetails) {
            const detail = paperDetails[paperId];
            completePaperDetails[paperId] = {
                backgroundContent: detail.backgroundContent || '暂无研究背景信息',
                mainContent: detail.mainContent || '暂无研究内容信息',
                conclusionContent: detail.conclusionContent || '暂无研究结论信息',
                linkContent: detail.linkContent || '暂无全文链接',
                homepageImages: detail.homepageImages || [],
                keyImages: detail.keyImages || []
            };
        }
        
        return completePaperDetails;
    } catch (error) {
        console.error('从localStorage获取数据失败:', error);
        return {};
    }
}
