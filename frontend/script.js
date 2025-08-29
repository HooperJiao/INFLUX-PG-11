// frontend/script.js

// 从 localStorage 获取已有 token
let AUTH_TOKEN = localStorage.getItem("auth_token") || null;
const loginBtn = document.getElementById("login-btn");
const loginStatus = document.getElementById("login-status");

if (AUTH_TOKEN) {
    loginStatus.textContent = "已登录 (token 已存)";
    loginStatus.style.color = "green";
} else {
    loginStatus.textContent = "未登录";
    loginStatus.style.color = "red";
}

// 登录逻辑：只提交 InfluxDB Token
loginBtn.onclick = async () => {
    const token = document.getElementById("influx-token").value.trim();
    if (!token) { 
        alert("请输入 Influx Token"); 
        return; 
    }
    try {
        const resp = await fetch('http://127.0.0.1:8000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        if (!resp.ok) {
            const e = await resp.json().catch(() => ({detail: resp.statusText}));
            alert("登录失败: " + (e.detail || resp.statusText));
            return;
        }

        const j = await resp.json();
        AUTH_TOKEN = j.access_token;
        localStorage.setItem("auth_token", AUTH_TOKEN);
        loginStatus.textContent = "已登录";
        loginStatus.style.color = "green";
        alert("登录成功");

        // 登录成功后加载 buckets
        await loadBucketsToSelects();
    } catch (err) {
        alert("登录请求失败: " + err);
        console.error(err);
    }
};

// 向后端发送带 token 的请求
function authHeaders() {
    const h = {'Content-Type': 'application/json'};
    if (AUTH_TOKEN) h['Authorization'] = 'Bearer ' + AUTH_TOKEN;
    return h;
}

// 全局 query 状态
let queryState = {
    bucket: null,
    measurement: null,
    fields: [],
    start: null,
    stop: null,
    filters: []
};

// 拖拽 Function
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev) { ev.dataTransfer.setData("text", ev.target.id); }
function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    if (!data) return;
    addBuilderComponent(data);
}

// 添加构件
function addBuilderComponent(type) {
    const builder = document.getElementById("builder");
    const block = document.createElement("div");
    block.className = "builder-block";

    if (type === "bucket") {
        block.innerHTML = `<label>Bucket: <select id="bucket-select"></select></label>`;
        builder.appendChild(block);
        loadBucketsToSelects();
        const sel = block.querySelector("#bucket-select");
        sel.onchange = (e) => { 
            queryState.bucket = e.target.value; 
            updateFlux(); 
            loadMeasurements(e.target.value); 
        };
        return;
    }

    if (type === "measurement") {
        block.innerHTML = `<label>Measurement: <select id="measurement-select"></select></label>`;
        builder.appendChild(block);
        return;
    }

    if (type === "field") {
        block.innerHTML = `<label>Field: <select id="field-select"></select></label> <button type="button" id="add-field-btn">添加 Field</button>`;
        builder.appendChild(block);
        const btn = block.querySelector("#add-field-btn");
        btn.onclick = () => {
            const sel = block.querySelector("#field-select");
            if (sel && sel.value) { 
                queryState.fields.push(sel.value); 
                updateFlux(); 
                alert("已添加字段: " + sel.value); 
            }
        };
        return;
    }

    if (type === "timerange") {
        block.innerHTML = `
            <label>Start: <input type="datetime-local" id="start-input"></label>
            <label>Stop: <input type="datetime-local" id="stop-input"></label>
        `;
        builder.appendChild(block);
        block.querySelector("#start-input").onchange = (e) => { 
            queryState.start = e.target.value; 
            updateFlux(); 
        };
        block.querySelector("#stop-input").onchange = (e) => { 
            queryState.stop = e.target.value; 
            updateFlux(); 
        };
        return;
    }

    if (type === "filter") {
        block.innerHTML = `
            <label>Filter Field: <input type="text" id="filter-field"></label>
            <label>Operator: <select id="filter-op">
                <option value="==">==</option>
                <option value="!=">!=</option>
                <option value=">">></option>
                <option value="<"><</option>
            </select></label>
            <label>Value: <input type="text" id="filter-val"></label>
            <button type="button" id="add-filter-btn">添加 Filter</button>
        `;
        builder.appendChild(block);
        block.querySelector("#add-filter-btn").onclick = () => {
            const f = block.querySelector("#filter-field").value.trim();
            const op = block.querySelector("#filter-op").value;
            const v = block.querySelector("#filter-val").value.trim();
            if (!f || !v) { alert("请输入字段和值"); return; }
            queryState.filters.push({field: f, operator: op, value: v});
            updateFlux();
            alert("已添加 filter");
        };
        return;
    }
}

// load the Buckets
async function loadBucketsToSelects() {
    if (!AUTH_TOKEN) return;
    try {
        const resp = await fetch('http://127.0.0.1:8000/api/buckets', { headers: authHeaders() });
        if (!resp.ok) { console.warn("无法加载 buckets", resp.status); return; }
        const buckets = await resp.json();
        document.querySelectorAll("#bucket-select").forEach(sel => {
            sel.innerHTML = "";
            buckets.forEach(b => {
                const opt = document.createElement("option");
                opt.value = b; opt.text = b; sel.appendChild(opt);
            });
            if (buckets.length>0) {
                sel.value = buckets[0];
                queryState.bucket = buckets[0];
                updateFlux();
                loadMeasurements(buckets[0]);
            }
        });
    } catch (err) {
        console.error("加载 buckets 错误", err);
    }
}

// Load Measurements
async function loadMeasurements(bucket) {
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/measurements?bucket=${encodeURIComponent(bucket)}`, { headers: authHeaders() });
        if (!resp.ok) { console.warn("无法加载 measurements", resp.status); return; }
        const measurements = await resp.json();
        document.querySelectorAll("#measurement-select").forEach(sel => {
            sel.innerHTML = "";
            measurements.forEach(m => {
                const opt = document.createElement("option"); opt.value = m; opt.text = m; sel.appendChild(opt);
            });
            if (measurements.length>0) {
                sel.value = measurements[0];
                queryState.measurement = measurements[0];
                updateFlux();
                loadFields(bucket, measurements[0]);
            }
            sel.onchange = (e) => { 
                queryState.measurement = e.target.value; 
                updateFlux(); 
                loadFields(bucket, e.target.value); 
            };
        });
    } catch (err) { console.error(err); }
}

// 加载 Fields
async function loadFields(bucket, measurement) {
    try {
        const resp = await fetch(`http://127.0.0.1:8000/api/fields?bucket=${encodeURIComponent(bucket)}&measurement=${encodeURIComponent(measurement)}`, { headers: authHeaders() });
        if (!resp.ok) return;
        const fields = await resp.json();
        document.querySelectorAll("#field-select").forEach(sel => {
            sel.innerHTML = "";
            fields.forEach(f => {
                const opt = document.createElement("option"); opt.value = f; opt.text = f; sel.appendChild(opt);
            });
        });
    } catch (err) { console.error(err); }
}

// Flux 查询
function updateFlux() {
    let flux = "";
    if (queryState.bucket) flux += `from(bucket: "${queryState.bucket}")\n`;
    if (queryState.start) {
        const start = new Date(queryState.start).toISOString();
        const stop = queryState.stop ? new Date(queryState.stop).toISOString() : 'now()';
        flux += `  |> range(start: ${JSON.stringify(start)}, stop: ${JSON.stringify(stop)})\n`;
    } else {
        flux += `  |> range(start: -1h)\n`;
    }
    if (queryState.measurement) flux += `  |> filter(fn: (r) => r._measurement == "${queryState.measurement}")\n`;
    queryState.fields.forEach(f => flux += `  |> filter(fn: (r) => r._field == "${f}")\n`);
    queryState.filters.forEach(fl => flux += `  |> filter(fn: (r) => r["${fl.field}"] ${fl.operator} "${fl.value}")\n`);
    document.getElementById("flux-code").textContent = flux;
}

// Draw the graph and tables
let chart = null;
async function runQuery() {
    const payload = {
        bucket: queryState.bucket,
        measurement: queryState.measurement,
        fields: queryState.fields,
        start: queryState.start,
        stop: queryState.stop,
        filters: queryState.filters
    };
    try {
        const resp = await fetch('http://127.0.0.1:8000/api/query', { method: 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
        if (!resp.ok) {
            const err = await resp.json().catch(()=>({detail:resp.statusText}));
            alert("查询失败: " + (err.detail || resp.statusText));
            return;
        }
        const body = await resp.json();
        document.getElementById("flux-code").textContent = body.flux;
        const results = body.results;
        if (!results || results.length === 0) { alert("无结果"); return; }

        const labels = results.map(r => new Date(r.time).toLocaleString());
        const values = results.map(r => Number(r.value));
        const ctx = document.getElementById('chart').getContext('2d');
        if (chart) chart.destroy();
        chart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [{ label: results[0].field || 'value', data: values, fill: false }] },
            options: { scales: { x: { display: true }, y: { display: true } } }
        });
    } catch (err) {
        console.error("runQuery error", err);
        alert("查询请求发生错误/Error when query: " + err);
    }
}
