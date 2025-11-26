// ======== GitHub SHA 自動更新（最終穩定版） ========
(async function autoUpdate() {
    try {
        const api = "https://api.github.com/repos/HPLEE785/golf-score/commits/main";

        const res = await fetch(api, { cache: "no-store" });
        if (!res.ok) return;

        const json = await res.json();
        const remoteSHA = json.sha;
        const localSHA = localStorage.getItem("app_sha");

        // 第一次啟動，儲存 SHA 不刷新
        if (!localSHA) {
            localStorage.setItem("app_sha", remoteSHA);
            return;
        }

        // 有新版 → 重新載入
        if (localSHA !== remoteSHA) {
            localStorage.setItem("app_sha", remoteSHA);
            location.reload();
        }

    } catch (err) {
        console.warn("GitHub 更新檢查失敗：", err);
        // 重要：不能中斷後面程式
    }
})();

const HOLES = 18;

const PLAYERS = ["Lee", "Joye", "陳振峯", "李子瑋", "趙振民","巫吉生","林振翰","吳建輝","張嘉原","陳威宇"];

let currentSelect = 0;

let pars = Array(HOLES).fill(4);
let hdcp = Array(HOLES).fill(0);
let scores = [
    Array(HOLES).fill(""),
    Array(HOLES).fill(""),
    Array(HOLES).fill(""),
    Array(HOLES).fill("")
];

function openPlayerMenu(index) {
    currentSelect = index;
    const menu = document.getElementById("playerMenu");
    menu.innerHTML = "";

    PLAYERS.forEach(name => {
        const item = document.createElement("div");
        item.textContent = name;
        item.onclick = () => {
            document.getElementById("player" + index).value = name;
            menu.classList.add("hidden");
        };
        menu.appendChild(item);
    });

    menu.style.left = event.clientX + "px";
    menu.style.top = event.clientY + "px";
    menu.classList.remove("hidden");
}

document.addEventListener("click", function (e) {
    if (!e.target.classList.contains("select-btn")) {
        document.getElementById("playerMenu").classList.add("hidden");
    }
});

function createRow(i) {
    const row = document.createElement("div");
    row.className = "row";

    row.innerHTML = `
        <div>${i + 1}</div>
        <div><input type="number" value="${pars[i]}" onchange="pars[${i}]=+this.value"></div>
        <div><input type="number" value="${hdcp[i]}" onchange="hdcp[${i}]=+this.value"></div>
    `;

    for (let p = 0; p < 4; p++) {
        const btn = document.createElement("button");
        btn.className = "player-btn";
        btn.textContent = scores[p][i] === "" ? " " : scores[p][i];

        btn.onclick = () => {
            let val = scores[p][i];

            const cycle = ["", 3, 4, 5, 6, 7, 8, 9, 1, 2];
            let idx = cycle.indexOf(val);
            idx = (idx + 1) % cycle.length;
            scores[p][i] = cycle[idx];

            btn.textContent = scores[p][i] === "" ? " " : scores[p][i];

            applyColor(btn, pars[i], scores[p][i]);
            updateSummary();
        };

        applyColor(btn, pars[i], scores[p][i]);
        row.appendChild(btn);
    }

    return row;
}

function applyColor(btn, par, score) {
    btn.className = "player-btn";

    if (score === "") return;

    const diff = score - par;

    if (diff === 0) btn.classList.add("score-par");
    else if (diff === -1) btn.classList.add("score-birdie");
    else if (diff === -2) btn.classList.add("score-eagle");
    else if (diff <= -3) btn.classList.add("score-alb");
    else if (diff === 1) btn.classList.add("score-bogey");
    else if (diff >= 2) btn.classList.add("score-db");
}

function updateSummary() {
    let sums = [0, 0, 0, 0];

    for (let p = 0; p < 4; p++) {
        for (let i = 0; i < HOLES; i++) {
            let v = scores[p][i];
            if (v !== "") sums[p] += v;
        }
    }

    document.getElementById("sumScore1").textContent = "P1：" + sums[0];
    document.getElementById("sumScore2").textContent = "P2：" + sums[1];
    document.getElementById("sumScore3").textContent = "P3：" + sums[2];
    document.getElementById("sumScore4").textContent = "P4：" + sums[3];
}

function init() {
    const c = document.getElementById("hole-container");
    c.innerHTML = "";
    for (let i = 0; i < HOLES; i++) {
        c.appendChild(createRow(i));
    }
}
init();



