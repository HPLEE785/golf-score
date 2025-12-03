//-----------------------------------------------------
// 球場資料（你可以依需要改 PAR / HDCP）
//-----------------------------------------------------
const COURSE_DATA = {
    "台中國際": {
        zones: {
            "東": {
                par:  [4,4,3,5,4,4,3,5,4],
                hdcp: [2,8,5,4,7,1,9,3,6]
            },
            "中": {
                par:  [4,4,3,5,4,4,3,4,5],
                hdcp: [7,2,8,5,4,1,9,3,6]
            },
            "西": {
                par:  [5,4,3,4,4,3,4,5,4],
                hdcp: [3,6,9,8,1,4,7,2,5]
            }
        }
    },
    "豐原": {
        // 只有一個區 = 18 洞（OUT + IN）
        zones: {
            "OUT+IN": {
                par:  [4,5,5,3,4,4,3,4,3, 5,3,4,3,4,3,5,4,5],
                hdcp: [5,3,7,15,1,9,17,11,13, 4,18,2,16,10,14,12,6,8]
            }
        }
    }
};

//-----------------------------------------------------
// 玩家資料
//-----------------------------------------------------
const PLAYERS = [
    "張簡榮力","洪忠宜","陳振峯","李子瑋","趙振民",
    "巫吉生","林振翰","吳建輝","張嘉原","陳威宇"
];

let playerName = ["P1","P2","P3","P4"];

// scores[p][holeIndex]  共 18 洞（0~17）
let scores = [
    Array(18).fill(""),
    Array(18).fill(""),
    Array(18).fill(""),
    Array(18).fill("")
];

//-----------------------------------------------------
// 球場 / 分區 狀態
//-----------------------------------------------------
let currentCourse = "台中國際";
let zoneA = "";
let zoneB = "";
let zoneListA = [];
let zoneListB = [];

//-----------------------------------------------------
// 初始化球場選單
//-----------------------------------------------------
function initCourseSelect() {
    const sel = document.getElementById("courseSelect");
    sel.innerHTML = "";

    Object.keys(COURSE_DATA).forEach(c => {
        const op = document.createElement("option");
        op.value = c;
        op.textContent = c;
        sel.appendChild(op);
    });

    sel.value = currentCourse;
    updateZones();
}

//-----------------------------------------------------
// 更新分區（切換球場時呼叫）
//-----------------------------------------------------
function updateZones() {
    const zones = Object.keys(COURSE_DATA[currentCourse].zones);

    if (zones.length === 1) {
        // 18 洞球場：A / B 都指向同一區
        zoneA = zones[0];
        zoneB = zones[0];
        zoneListA = [zones[0]];
        zoneListB = [zones[0]];
    } else {
        // 多區球場：A / B 各自循環列表
        zoneListA = [...zones];
        zoneListB = [...zones];
        zoneA = zones[0];
        zoneB = zones[1];
    }

    document.getElementById("zoneA_btn").textContent = zoneA;
    document.getElementById("zoneB_btn").textContent = zoneB;

    render();
}

//-----------------------------------------------------
// 分區按鈕循環
//-----------------------------------------------------
function cycleZone(type) {
    const list = (type === "A") ? zoneListA : zoneListB;
    if (list.length <= 1) return;  // 18 洞球場只有一個區，不切換

    let z = (type === "A") ? zoneA : zoneB;
    let idx = list.indexOf(z);
    idx = (idx + 1) % list.length;

    if (type === "A") zoneA = list[idx];
    else zoneB = list[idx];

    document.getElementById("zoneA_btn").textContent = zoneA;
    document.getElementById("zoneB_btn").textContent = zoneB;

    render();
}

//-----------------------------------------------------
// 玩家姓名循環
//-----------------------------------------------------
function cyclePlayer(p) {
    let idx = PLAYERS.indexOf(playerName[p-1]);
    idx = (idx + 1) % PLAYERS.length;
    playerName[p-1] = PLAYERS[idx];

    document.getElementById(`p${p}_name`).textContent = playerName[p-1];
    document.getElementById(`h_p${p}`).textContent = playerName[p-1];

    render();
}

//-----------------------------------------------------
// 依 PAR 建立分數循環
// PAR=3 → [3,4,5,6,"",1,2]
// PAR=4 → [4,5,6,7,8,"",1,2,3]
// PAR=5 → [5,6,7,8,9,"",1,2,3,4]
//-----------------------------------------------------
function buildCycle(par) {
    let max;
    if (par === 3) max = 6;
    else if (par === 4) max = 8;
    else max = 9;

    const seq = [];
    for (let v = par; v <= max; v++) seq.push(v);
    seq.push("");              // 空白
    for (let v = 1; v < par; v++) seq.push(v);

    return seq;
}

//-----------------------------------------------------
// 建立單一洞的畫面列
//-----------------------------------------------------
function buildRow(i, parArr, hdcpArr, offset, zoneNameForLabel) {
    const row = document.createElement("div");
    row.className = "row";

    const holeLabel =
        zoneNameForLabel ? `${zoneNameForLabel}${i+1}` : (i + 1);

    row.innerHTML = `
        <div>${holeLabel}</div>
        <div>${parArr[i]}</div>
        <div>${hdcpArr[i]}</div>
    `;

    const PAR = parArr[i];
    const cycle = buildCycle(PAR);
    const globalIndex = i + offset;  // 0~17

    for (let p = 0; p < 4; p++) {
        const btn = document.createElement("button");
        btn.className = "score-btn";
        const val = scores[p][globalIndex];
        btn.textContent = (val === "" ? "" : val);

        applyColor(btn, PAR, val);

        btn.onclick = () => {
            // ① 若該洞 4 人都空白 → 全部初始化為 PAR
            let allEmpty = true;
            for (let q = 0; q < 4; q++) {
                if (scores[q][globalIndex] !== "") {
                    allEmpty = false;
                    break;
                }
            }
            if (allEmpty) {
                for (let q = 0; q < 4; q++) {
                    scores[q][globalIndex] = PAR;
                }
                render();
                return;
            }

            // ② 否則依照循環：P → P+1 → … → max → "" → 1 → 2 → … → P-1 → P
            let cur = scores[p][globalIndex];
            let idx = cycle.indexOf(cur);
            if (idx === -1) idx = 0;     // 理論上不會發生
            idx = (idx + 1) % cycle.length;
            scores[p][globalIndex] = cycle[idx];

            render();
        };

        row.appendChild(btn);
    }

    return row;
}

//-----------------------------------------------------
// 顏色 / 框線分類
//-----------------------------------------------------
function applyColor(btn, par, score) {
    btn.className = "score-btn";
    if (score === "" || score == null) return;

    const diff = score - par;

    if (diff === 0) {
        // Par：不特別上色
        return;
    } else if (diff === 1) {
        // Bogey：單藍框
        btn.classList.add("score-bogey");
    } else if (diff >= 2) {
        // Double Bogey 以上：雙藍框
        btn.classList.add("score-db");
    } else if (diff === -1) {
        // Birdie：單紅框
        btn.classList.add("score-birdie");
    } else if (diff <= -2) {
        // Eagle / Albatross：雙紅框
        btn.classList.add("score-eagle");
    }
}

//-----------------------------------------------------
// Summary 更新
//-----------------------------------------------------
function updateSummary() {
    const zonesObj = COURSE_DATA[currentCourse].zones;
    const is18 = Object.keys(zonesObj).length === 1;

    // 顯示球場 / 分區
    if (is18) {
        document.getElementById("sumCourse").textContent =
            `球場：${currentCourse}`;
    } else {
        document.getElementById("sumCourse").textContent =
            `球場：${currentCourse} / ${zoneA} + ${zoneB}`;
    }

    // 總 Par
    let totalPar = 0;
    if (is18) {
        const parAll = zonesObj[zoneA].par;
        totalPar = parAll.reduce((a, b) => a + b, 0);
    } else {
        const parA = zonesObj[zoneA].par;
        const parB = zonesObj[zoneB].par;
        totalPar = parA.reduce((a, b) => a + b, 0) +
                   parB.reduce((a, b) => a + b, 0);
    }
    document.getElementById("sumPar").textContent = `總 Par：${totalPar}`;

    // 各玩家總桿
    for (let p = 0; p < 4; p++) {
        const sum = scores[p]
            .filter(x => x !== "")
            .reduce((a, b) => a + b, 0);
        document.getElementById(`sumScore${p+1}`).textContent =
            `${playerName[p]}：${sum}`;
    }
}

//-----------------------------------------------------
// 重新繪製畫面
//-----------------------------------------------------
function render() {
    const box = document.getElementById("hole-container");
    box.innerHTML = "";

    const zonesObj = COURSE_DATA[currentCourse].zones;
    const is18 = Object.keys(zonesObj).length === 1;

    let frontPar, frontHdcp, backPar, backHdcp;
    let labelA = zoneA;
    let labelB = zoneB;

    if (is18) {
        const fullPar  = zonesObj[zoneA].par;
        const fullHdcp = zonesObj[zoneA].hdcp;

        frontPar  = fullPar.slice(0, 9);
        frontHdcp = fullHdcp.slice(0, 9);
        backPar   = fullPar.slice(9, 18);
        backHdcp  = fullHdcp.slice(9, 18);

        labelA = ""; // 18 洞球場不顯示區名，只顯示 1,2,...18
        labelB = "";
    } else {
        frontPar  = zonesObj[zoneA].par;
        frontHdcp = zonesObj[zoneA].hdcp;
        backPar   = zonesObj[zoneB].par;
        backHdcp  = zonesObj[zoneB].hdcp;
    }

    // --- 前 9 洞 ---
    for (let i = 0; i < 9; i++) {
        box.appendChild(buildRow(i, frontPar, frontHdcp, 0, labelA));
    }

    // --- 中間再顯示一次玩家姓名（同一組） ---
    const mid = document.getElementById("player-row-2");
    mid.innerHTML = "";
    for (let p = 1; p <= 4; p++) {
        const b = document.createElement("button");
        b.className = "player-name";
        b.textContent = playerName[p-1];
        b.onclick = () => cyclePlayer(p);
        mid.appendChild(b);
    }

    // --- 後 9 洞 ---
    for (let i = 0; i < 9; i++) {
        box.appendChild(buildRow(i, backPar, backHdcp, 9, labelB));
    }

    updateSummary();
}

//-----------------------------------------------------
// 球場選擇切換
//-----------------------------------------------------
function changeCourse() {
    currentCourse = document.getElementById("courseSelect").value;
    updateZones();
}

//-----------------------------------------------------
// 初始化
//-----------------------------------------------------
initCourseSelect();
render();
