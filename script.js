/**
 * 谁是卧底助手 - 标准模式 + 依次显示
 * 
 * 游戏规则：
 * - N-1 个平民拿到相同词A
 * - 1 个卧底拿到相近词B
 * - 每次只显示一个玩家的词，防止偷看
 */

const WORDS_FILE = "words_pairs.txt";
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 20;

let wordPairs = [];
let gameState = {
    players: [],      // {name, word, role}
    currentIndex: -1,
    isStarted: false
};

// 页面加载时预加载词库并恢复人数设置
document.addEventListener("DOMContentLoaded", async () => {
    try {
        wordPairs = await loadWordPairs();
        console.log(`✅ 词库加载完成，共 ${wordPairs.length} 对`);
    } catch (e) {
        console.error("词库加载失败:", e);
        alert("词库加载失败，请检查 words_pairs.txt 文件是否存在");
    }

    // 恢复上次选择的人数
    const savedCount = localStorage.getItem("playerCount");
    if (savedCount) {
        document.getElementById("playerCount").value = savedCount;
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

    // 保存人数到 localStorage
    localStorage.setItem("playerCount", cnt);

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
 * 显示当前玩家（直接显示词语）
 */
function showCurrentPlayer() {
    const player = gameState.players[gameState.currentIndex];
    const container = document.getElementById("playerCard");

    // 直接显示玩家名和词语
    container.innerHTML = `
        <div class="player-header">
            <span class="player-number">${player.name}</span>
            <span class="progress">${gameState.currentIndex + 1} / ${gameState.players.length}</span>
        </div>
        <div class="word-revealed">
            <div class="the-word">${player.word}</div>
            <p class="hint-text">记住你的词，但不要说出来！</p>
            <p class="role-hint">🎭 你不知道自己是什么身份</p>
        </div>
    `;

    // 显示"隐藏并下一个"按钮
    document.getElementById("nextBtn").classList.remove("hidden");
    document.getElementById("hideBtn").classList.add("hidden");
}

/**
 * 隐藏词语（准备传递手机）- 保留以备后用
 */
function hideWord() {
    showCurrentPlayer();
}

/**
 * 下一个玩家（先隐藏，再显示下一个）
 */
function nextPlayer() {
    // 先隐藏当前内容
    const container = document.getElementById("playerCard");
    container.innerHTML = `
        <div class="pass-screen">
            <div class="pass-icon">📱</div>
            <p class="pass-text">请传给下一个玩家</p>
            <button class="btn-reveal" onclick="showNextPlayer()">下一个玩家查看</button>
        </div>
    `;
    document.getElementById("nextBtn").classList.add("hidden");
}

/**
 * 显示下一个玩家
 */
function showNextPlayer() {
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
 * 显示游戏开始界面（结束后显示身份）
 */
function showGameStart() {
    // 生成玩家身份列表（游戏结束后才能看到）
    const playerList = gameState.players.map(p => `
        <div class="player-result ${p.isMole ? 'mole' : 'civilian'}">
            <span>${p.name}</span>
            <span>${p.word}</span>
            <span class="role-tag">${p.role}</span>
        </div>
    `).join('');

    document.getElementById("gamePanel").innerHTML = `
        <div class="game-ready">
            <h2>🎮 游戏开始！</h2>
            <p>所有玩家已查看词语，开始描述吧！</p>

            <div class="reveal-section">
                <h3>🔍 身份揭秘（仅主持人查看）</h3>
                <div class="word-pair-info">
                    <p>平民词：<strong>${gameState.pair.civilian}</strong></p>
                    <p>卧底词：<strong>${gameState.pair.mole}</strong></p>
                </div>
                <div class="players-reveal">
                    ${playerList}
                </div>
            </div>

            <button onclick="resetGame()" class="btn-restart">再玩一局</button>
        </div>
    `;

    // 显示导出按钮
    document.getElementById("exportBtn").classList.remove("hidden");
}

/**
 * 重置游戏（保留人数设置）
 */
function resetGame() {
    // 重置游戏状态
    gameState = {
        players: [],
        currentIndex: -1,
        isStarted: false
    };

    // 恢复游戏面板原始结构
    document.getElementById("gamePanel").innerHTML = `
        <div class="progress-container">
            <div id="progressBar" class="progress-bar"></div>
        </div>

        <div id="playerCard" class="player-card">
            <!-- 动态生成玩家卡片 -->
        </div>

        <div class="game-controls">
            <button id="hideBtn" class="btn-secondary hidden">👁️ 隐藏词语</button>
            <button id="nextBtn" class="btn-primary">我记住了，下一个 →</button>
        </div>
    `;

    // 重新绑定事件
    document.getElementById("nextBtn").addEventListener("click", nextPlayer);
    document.getElementById("hideBtn").addEventListener("click", hideWord);

    // 隐藏导出按钮
    document.getElementById("exportBtn").classList.add("hidden");

    // 回到设置界面
    document.getElementById("gamePanel").classList.add("hidden");
    document.getElementById("setupPanel").classList.remove("hidden");

    // 人数设置会自动保留（从 localStorage 读取）
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