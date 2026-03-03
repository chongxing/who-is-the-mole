/**
 * 谁是卧底助手 - 标准模式 + 依次显示
 * 
 * 游戏规则：
 * - N-1 个平民拿到相同词A
 * - 1 个卧底拿到相近词B
 * - 每次只显示一个玩家的词，防止偷看
 */

const WORDS_FILE = "words_pairs.txt";
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 20;

let wordPairs = [];
let gameState = {
    players: [],      // {name, word, role}
    currentIndex: -1,
    isStarted: false
};

// 页面加载时预加载词库
document.addEventListener("DOMContentLoaded", async () => {
    try {
        wordPairs = await loadWordPairs();
        console.log(`✅ 词库加载完成，共 ${wordPairs.length} 对`);
    } catch (e) {
        console.error("词库加载失败:", e);
        alert("词库加载失败，请检查 words_pairs.txt 文件是否存在");
    }
});

/**
 * 读取词对文件
 */
async function loadWordPairs() {
    const response = await fetch(WORDS_FILE);
    if (!response.ok) {
        throw new Error(`无法加载 ${WORDS_FILE}`);
    }
    const text = await response.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    
    const pairs = [];
    for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
            pairs.push({ civilian: parts[0], mole: parts[1] });
        }
    }
    
    if (pairs.length < 1) {
        throw new Error("词库为空");
    }
    
    return pairs;
}

/**
 * 标准模式分配角色
 * - N-1 个平民（词A）
 * - 1 个卧底（词B）
 */
function assignRolesStandard(playerCount) {
    // 随机选择一个词对
    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    
    // 随机选择卧底位置
    const moleIndex = Math.floor(Math.random() * playerCount);
    
    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const isMole = i === moleIndex;
        players.push({
            name: `玩家 ${i + 1}`,
            word: isMole ? pair.mole : pair.civilian,
            role: isMole ? "卧底" : "平民",
            isMole: isMole
        });
    }
    
    return { players, pair };
}

/**
 * 开始游戏
 */
function startGame() {
    const cnt = parseInt(document.getElementById("playerCount").value);
    
    if (isNaN(cnt) || cnt < MIN_PLAYERS || cnt > MAX_PLAYERS) {
        alert(`玩家人数必须在 ${MIN_PLAYERS} ~ ${MAX_PLAYERS} 之间`);
        return;
    }
    
    if (wordPairs.length === 0) {
        alert("词库尚未加载完成");
        return;
    }
    
    // 分配角色
    const { players, pair } = assignRolesStandard(cnt);
    gameState = {
        players: players,
        currentIndex: 0,
        isStarted: true,
        pair: pair
    };
    
    // 切换到游戏界面
    document.getElementById("setupPanel").classList.add("hidden");
    document.getElementById("gamePanel").classList.remove("hidden");
    
    // 显示第一个玩家
    showCurrentPlayer();
    
    // 更新进度
    updateProgress();
}

/**
 * 显示当前玩家
 */
function showCurrentPlayer() {
    const player = gameState.players[gameState.currentIndex];
    const container = document.getElementById("playerCard");
    
    // 先隐藏词，只显示玩家名
    container.innerHTML = `
        <div class="player-header">
            <span class="player-number">${player.name}</span>
            <span class="progress">${gameState.currentIndex + 1} / ${gameState.players.length}</span>
        </div>
        <div class="word-hidden" onclick="revealWord()">
            <span class="tap-hint">👆 点击查看词语</span>
        </div>
        <div class="word-revealed hidden">
            <div class="the-word">${player.word}</div>
            <div class="role-badge ${player.isMole ? 'role-mole' : 'role-civilian'}">
                ${player.role}
            </div>
        </div>
    `;
    
    // 隐藏按钮
    document.getElementById("nextBtn").classList.add("hidden");
    document.getElementById("hideBtn").classList.remove("hidden");
}

/**
 * 显示词语（点击后）
 */
function revealWord() {
    document.querySelector(".word-hidden").classList.add("hidden");
    document.querySelector(".word-revealed").classList.remove("hidden");
    document.getElementById("nextBtn").classList.remove("hidden");
    document.getElementById("hideBtn").classList.add("hidden");
}

/**
 * 隐藏词语（准备传递手机）
 */
function hideWord() {
    showCurrentPlayer();
}

/**
 * 下一个玩家
 */
function nextPlayer() {
    gameState.currentIndex++;
    
    if (gameState.currentIndex >= gameState.players.length) {
        // 所有玩家都已查看，显示游戏开始
        showGameStart();
    } else {
        showCurrentPlayer();
        updateProgress();
    }
}

/**
 * 更新进度显示
 */
function updateProgress() {
    const progress = ((gameState.currentIndex) / gameState.players.length) * 100;
    document.getElementById("progressBar").style.width = progress + "%";
}

/**
 * 显示游戏开始界面
 */
function showGameStart() {
    document.getElementById("gamePanel").innerHTML = `
        <div class="game-ready">
            <h2>🎮 游戏开始！</h2>
            <p>所有玩家已查看词语</p>
            <div class="word-pair-info">
                <p>平民词：<strong>${gameState.pair.civilian}</strong></p>
                <p>卧底词：<strong>${gameState.pair.mole}</strong></p>
            </div>
            <button onclick="location.reload()" class="btn-restart">再玩一局</button>
        </div>
    `;
}

/**
 * 导出游戏记录
 */
function exportGame() {
    if (!gameState.isStarted) {
        alert("游戏尚未开始");
        return;
    }
    
    const header = ["玩家", "词语", "角色"];
    const rows = gameState.players.map(p => [p.name, p.word, p.role]);
    
    const csvContent = [header, ...rows]
        .map(r => r.join(","))
        .join("\r\n");
    
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `谁是卧底_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 事件绑定
document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("nextBtn").addEventListener("click", nextPlayer);
document.getElementById("hideBtn").addEventListener("click", hideWord);
document.getElementById("exportBtn").addEventListener("click", exportGame);