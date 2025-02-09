// ver. 1.0.0
/**
 * Canvas
 */
const canvasWrap = document.getElementById('canvas-wrap'); // キャンバス領域
const canvasAll = document.getElementsByTagName('canvas'); // すべてのキャンバス
const hCanvas = document.getElementById('haikei-canvas'); // 背景画像用キャンバス
const gCanvas = document.getElementById('grid-canvas'); // グリッド線用キャンバス
const layers = document.getElementsByClassName('layer'); // レイヤー用キャンバス
const hCtx = hCanvas.getContext('2d', {willReadFrequently: true}); // 背景画像用のコンテキスト
const gCtx = gCanvas.getContext('2d'); // グリッド線用のコンテキスト

// キャンバスサイズの設定
let cw = 640;
let ch = 640;
if (window.innerWidth < 648) {
    cw = cw / 2;
    ch = ch / 2;
}

for (const cvs of canvasAll) {
    cvs.width = cw;
    cvs.height = ch;
}

// レイヤー用キャンバスのz-indexの設定
const ZI_VAL = 99; // 最上層のz-indexの定数
let ziv = ZI_VAL;
for (const cvs of layers) {
    cvs.style.zIndex = String(ziv);
    ziv--;
}

/**
 * Grid
 */
const gridSizeBtn = document.getElementById('grid-size-btn'); // グリッドサイズ設定ボタン
const dispGiridLine = document.getElementById('disp-grid-line'); // グリッド線表示のボタン
const gridLineColor = document.getElementById('grid-line-color'); // グリッド線の色の設定
let gridCount = 16; // グリッドサイズ（初期値）
let gridWidth = cw / gridCount; // グリッドの幅
let gridColor = gridLineColor.value; // グリッド線の色

// Grid line drawing function
function gridLineDraw(canvas, ctx, color) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    for (let i = gridWidth; i < canvas.width; i += gridWidth) {
        // 列
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();

        // 行
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // グリッド線の表示
    dispGiridLine.checked = true;
    gCanvas.classList.add('show');
}

// グリッドサイズの設定（リセット）
gridSizeBtn.value = String(gridCount); // 初期設定
gridSizeBtn.addEventListener('change', (e) => {
    if (!confirm('リセットしますか？')) { // リセットの確認
        e.target.value = String(gridCount);
        return;
    };

    // グリッドサイズの設定
    if (e.target.value === 'reset') {
        e.target.value = String(gridCount);
    } else {
        gridCount = Number(e.target.value);
    }
    gridWidth = cw / gridCount;

    // リセット
    hCtx.clearRect(0, 0, cw, ch);
    gridLineDraw(gCanvas, gCtx, gridColor);
    lConfig.layer1.reset(gridCount);
    lConfig.layer2.reset(gridCount);
    lConfig.layer3.reset(gridCount);
});

// グリッド線の表示
dispGiridLine.addEventListener('click', (e) => {
    if (e.target.checked) {
        gCanvas.classList.add('show');
    } else {
        gCanvas.classList.remove('show');
    }
});

// グリッド線の色の設定
gridLineColor.addEventListener('change', (e) => {
    gridColor = e.target.value;
    gridLineDraw(gCanvas, gCtx, gridColor);
});

/**
 * Edit
 */
const drawStateBtn = document.getElementsByName('draw-state-btn'); // 描画状態のボタン
let dState = 'draw'; // 描画状態（初期値）

// Setting the drawing state
function toggleDrawState(e) {
    dState = e.target.value;
}

// 描画状態の設定
for (const btn of drawStateBtn) {
    if (btn.value === 'draw') {
        btn.checked = true;
    }

    btn.addEventListener('click', toggleDrawState);
}

/**
 * Undo/Redo
 */
const undoBtn = document.getElementById('undo-btn'); // アンドゥボタン
const redoBtn = document.getElementById('redo-btn'); // リドゥボタン

// Undo drawing function
function undoDraw(unre, ctx, masuObj) {
    const undoItem = unre.undo(); // アンドゥ配列から取り出す
    if (undoItem === null) { // 何も無い場合
        return;
    }

    const masu = masuObj.grid; // マス目の配列

    if (unre.undoCount === 0) { // 配列が空の場合
        masuObj.reset(gridCount);
        ctx.clearRect(0, 0, cw, ch);
    } else {
        // ドットの描画
        for (let i = 0; i < gridCount; i++) {
            for (let j = 0; j < gridCount; j++) {
                masu[i][j] = unre.undoStack[unre.undoCount - 1][i][j];
                if (masu[i][j] !== null) {
                    ctx.fillStyle = masu[i][j];
                    ctx.fillRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
                } else {
                    ctx.clearRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
                }
            }
        }
    }
}

// 戻す（Undo）
undoBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 規定の動作を抑止する
    if (!isLoadLayer) { // 読み込みの確認
        return;
    }

    // Undoの描画
    const layer = lConfig[activeLayer];
    if (layer && layer.disp) {
        undoDraw(layer.unre, layer.ctx, layer.masuObj);
    }
});

// Redo drawing function
function redoDraw(unre, ctx, masuObj) {
    const redoItem = unre.redo(); // リドゥ配列から取り出す
    if (redoItem === null) { // 何も無い場合
        return;
    }

    const masu = masuObj.grid; // マス目の配列

    // ドットの描画
    for (let i = 0; i < gridCount; i++) {
        for (let j = 0; j < gridCount; j++) {
            masu[i][j] = redoItem[i][j];
            if (masu[i][j] !== null) {
                ctx.fillStyle = masu[i][j];
                ctx.fillRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
            } else {
                ctx.clearRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
            }
        }
    }
}

// 直す（Redo）
redoBtn.addEventListener('click', (e) => {
	e.preventDefault(); // 規定の動作を抑止する
    if (!isLoadLayer) { // 読み込みの確認
        return;
    }

    // Redoの描画
    const layer = lConfig[activeLayer];
    if (layer && layer.disp) {
        redoDraw(layer.unre, layer.ctx, layer.masuObj);
    }
});

/**
 * Dot Color
 */
const paletteBtns = document.getElementsByName('palette-btn'); // パレット選択ボタン
const dotColors = document.getElementsByClassName('dot-color'); // ドット色の設定
const beforeColor = document.getElementById('before-color'); // 元の色選択ボタン
const afterColor = document.getElementById('after-color'); // 変換色選択ボタン
const convertBtn = document.getElementById('convert-btn'); // 色の変換ボタン
const colorClear = document.getElementById('color-clear'); // 色の削除ボタン
let dotColor = ''; // ドット色

// Palette selection
function selectPalette(e) {
    const colorInput = e.target.closest('.palette-item').querySelector('.dot-color');
    dotColor = colorInput.value;
}

// パレットの選択
for (const btn of paletteBtns) {
    if (btn.value === '1') {
        btn.checked = true;
        const colorInput = btn.closest('.palette-item').querySelector('.dot-color');
        dotColor = colorInput.value; // ドット色の初期値
    }

    btn.addEventListener('click', selectPalette);
}

// Setting the dot color
function changeDotColor(e) {
    const paletteInput = e.target.closest('.palette-item').querySelector('.palette-btn');
    paletteInput.checked = true;
    dotColor = e.target.value;
}

// ドット色の設定
for (const ele of dotColors) {
    ele.addEventListener('change', changeDotColor);
}

// Color conversion drawing function
function colorConvertDraw(ctx, masuObj, unre, clear = false) {
    let isStorable = false; // 格納の確認（初期値）
    const masu = masuObj.grid; // マス目の配列

    // ドットの描画
    for (let i = 0; i < gridCount; i++) {
        for (let j = 0; j < gridCount; j++) {
            if (masu[i][j] === beforeColor.value) { // 色が一致した場合
                if (!clear) {
                    if (beforeColor.value === afterColor.value) { //前と後の色が同じ場合
                        return;
                    }
                    masu[i][j] = afterColor.value;
                    ctx.fillStyle = afterColor.value;
                    ctx.fillRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
                } else {
                    masu[i][j] = null;
                    ctx.clearRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
                }
                isStorable = true;
            }
        }
    }

    // 状態の格納（アンドゥ／リドゥ）
    if (isStorable) {
        const copy = masu.map(row => [...row]);
        unre.store(copy);
    }
}

// 色の変換
convertBtn.addEventListener('click', (e) => {
    e.preventDefault(); // 規定の動作を抑止する
    if (!isLoadLayer) { // 読み込みの確認
        return;
    }

    // 色の変換の描画
    const layer = lConfig[activeLayer];
    if (layer && layer.disp) {
        colorConvertDraw(layer.ctx, layer.masuObj, layer.unre);
    }
});

// 色の削除
colorClear.addEventListener('click', (e) => {
    e.preventDefault(); // 規定の動作を抑止する
    if (!isLoadLayer) { // 読み込みの確認
        return;
    }

    // 色の削除
    const layer = lConfig[activeLayer];
    if (layer && layer.disp) {
        colorConvertDraw(layer.ctx, layer.masuObj, layer.unre, true);
    }
});

/**
 *  Background Color
 */
const bgColor = document.getElementById('bg-color'); // 背景色の設定
const includeBgc = document.getElementById('include-bgc'); // 背景色を含めるボタン
let checkIncBgc = false; // 初期値（false）

// 背景色の設定
canvasWrap.style.backgroundColor = bgColor.value; // 初期設定
bgColor.addEventListener('change', (e) => {
	canvasWrap.style.backgroundColor = e.target.value;
});

// 背景色を含める
includeBgc.checked = checkIncBgc; // 初期設定
includeBgc.addEventListener('change', (e) => {
	checkIncBgc = e.target.checked;
});

/**
 * Layer
 */
const activeLayerBtns = document.getElementsByName('active-layer-btn'); // アクティブ状態ボタン
const dispLayerBtns = document.getElementsByClassName('disp-layer-btn'); // レイヤー表示ボタン
const layerItemWrap = document.getElementById('layer-item-wrap'); // レイヤーアイテムの親要素
const layerItems = document.getElementsByClassName('layer-item'); // レイヤーアイテム
const layerChangeBtn = document.getElementById('layer-change-btn'); // レイヤーの入れ替えボタン
const layerMergeBtn = document.getElementById('layer-merge-btn'); // レイヤーの統合ボタン
const LayerItemOrder = [...layerItems]; // レイヤーアイテムの順序の配列
let activeLayer = 'layer1'; // アクティブレイヤー（初期値）

// Setting active state
function setActiveLayer(e) {
    // 前のアクティブレイヤーからクラスを削除
    let layer = lConfig[activeLayer];
    layer.cvs.classList.remove('active');
    layer.lItem.classList.remove('active');

    activeLayer = e.target.value; // アクティブレイヤーの設定

    // 今のアクティブレイヤーにクラスを追加
    layer = lConfig[activeLayer];
    layer.cvs.classList.add('active');
    layer.lItem.classList.add('active');
}

// レイヤーのアクティブ設定
for (const btn of activeLayerBtns) {
    if (btn.value === activeLayer) {
        btn.checked = true;
    }

    btn.addEventListener('click', setActiveLayer);
}

// Layer display settings
function setLayerDisplay(e) {
    const layer = lConfig[e.target.value];
    if (e.target.checked) {
        layer.cvs.classList.remove('hide');
    } else {
        layer.cvs.classList.add('hide');
    }
}

// レイヤーの表示設定
for (const btn of dispLayerBtns) {
    btn.checked = true;
    btn.addEventListener('click', setLayerDisplay);
}

// Rotate layers in order
function rotateLayer(arr, value) {
    const idx = arr.indexOf(value); // 値の位置を取得
    if (idx < 0) {
        return;
    }

    if (arr.length > 0) {
        if (idx < arr.length - 1) {
            [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]; // 次の値と入れ替え
        } else {
            [arr[0], arr[idx]] = [arr[idx], arr[0]]; // 先頭の値と入れ替え
        }
    }
}

// Get number from id
function getNumberId(id) {
    const resultAry = id.match(/\d+/); // 数字部分を取得
    const num = resultAry ? Number(resultAry[0]) : null; // 数値に変換

    return num;
}

// レイヤーの入れ替え
layerChangeBtn.addEventListener('click', (e) => {
    const layer = lConfig[activeLayer];
    rotateLayer(LayerItemOrder, layer.lItem);
    ziv = ZI_VAL; // z-indexのリセット

    // レイヤーアイテムの挿入
    for (let i = 0; i < LayerItemOrder.length; i++) {
        layerItemWrap.appendChild(LayerItemOrder[i]);
        const num = getNumberId(LayerItemOrder[i].id);
        layers[num - 1].style.zIndex = String(ziv - i); // z-indexの再設定
    }
});

// Layer merge drawing function
function layerMergeDraw(topCtx, bottomCtx, topMasuObj, bottomMasuObj) {
    const tMasu = topMasuObj.grid; // 上レイヤーのマス目の配列
    const bMasu = bottomMasuObj.grid; // 下レイヤーのマス目の配列

    // 上レイヤーを下レイヤーに上書きする
    for (let i = 0; i < tMasu.length; i++) {
        for (let j = 0; j < tMasu[i].length; j++) {
            if (tMasu[i][j] !== null) {
                bMasu[i][j] = tMasu[i][j];
                bottomCtx.fillStyle = tMasu[i][j];
                bottomCtx.fillRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
            }
        }
    }

    // 上レイヤーを削除する
    topCtx.clearRect(0, 0, cw, ch);
    topMasuObj.reset(gridCount);
}

// レイヤーの統合
layerMergeBtn.addEventListener('click', (e) => {
    if (!confirm('統合しますか？')) { // 統合の確認
        return;
    };

    const tLayer = lConfig[activeLayer]; // 上レイヤー（アクティブレイヤー）
    let num = null; // 下レイヤーアイテムのID番号
    for (let i = 0; i < LayerItemOrder.length - 1; i++) {
        if (LayerItemOrder[i] === tLayer.lItem) {
            num = getNumberId(LayerItemOrder[i + 1].id);
        }
    }
    const bLayer = num ? lConfig['layer' + num] : null; // 下レイヤー

    if (bLayer === null) { // 最下層か判定
        console.error('No bottom layer.')
        alert('統合できませんでした。');
        return;
    }

    if (checkAllNull(tLayer.masuObj.grid)) { // すべてnullの場合
        console.error('Invalid data.')
        alert('統合できませんでした。');
        return;
    }

    // 統合の描画処理
    layerMergeDraw(tLayer.ctx, bLayer.ctx, tLayer.masuObj, bLayer.masuObj);
    
    // 状態の格納（アンドゥ／リドゥ）
    const copyTop = tLayer.masuObj.grid.map(row => [...row]); // 上レイヤーの配列をコピー
    tLayer.unre.store(copyTop);
    const copyBottom = bLayer.masuObj.grid.map(row => [...row]); // 下レイヤーの配列をコピー
    bLayer.unre.store(copyBottom);
});

/**
 * Download pixel art image
 */
const downloadImgBtn = document.getElementById('download-img-btn'); // 画像のダウンロードボタン

// Generate download image
function generateDownloadImg(canvas, ctx, masuObj) {
    const masu = masuObj.grid; // マス目の配列
    const defaultData =  ctx.getImageData(0, 0, cw, ch); // 追加前のデータ

    // 背景画像を追加
    if (showHaikei) {
        const haikeiData = hCtx.getImageData(0, 0, cw, ch); // 背景画像のデータ 
        ctx.putImageData(haikeiData, 0, 0); // レイヤーに描画

        // ドットの再描画
        for (let i = 0; i < gridCount; i++) {
            for (let j = 0; j < gridCount; j++) {
                if (masu[i][j] !== null) {
                    ctx.fillStyle = masu[i][j];
                    ctx.fillRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
                }
            }
        }
    }

    // 背景色を追加
    if (checkIncBgc) {
        ctx.globalCompositeOperation = 'destination-over'; // 背後にする
        ctx.fillStyle = bgColor.value;
        ctx.fillRect(0, 0, cw, ch);
    }

    const downloadData = canvas.toDataURL('image/png'); // ダウンロード用の画像データ

    // 元に戻す
    ctx.globalCompositeOperation = 'source-over'; // 既定に戻す
    ctx.putImageData(defaultData, 0, 0);

    return downloadData;
}

// Get the date
function getHiduke() {
    const d = new Date();
    return '' + d.getFullYear() + (d.getMonth() + 1) + d.getDate() + d.getHours() + d.getMinutes() + d.getSeconds();
}

// 画像のダウンロード
downloadImgBtn.addEventListener('click', (e) => {
    if (!isLoadLayer) { // 読み込みの確認
        return;
    }

    if (!confirm('画像をダウンロードしますか？')) { // 画像のダウンロードの確認
        e.preventDefault();

        return;
    };

    // ダウンロードデータの生成
    const layer = lConfig[activeLayer]; // アクティブレイヤーの取得
    const downloadData = generateDownloadImg(layer.cvs, layer.ctx, layer.masuObj); // ダウンロード用のデータの取得

    // ダウンロード設定
    e.target.href = downloadData;
    e.target.download = activeLayer + '_' + gridCount + '_' + getHiduke();
});

/**
 * Export/Import
 */
const exportBtn = document.getElementById('export-btn'); // exportボタン
const importBtn = document.getElementById('import-btn'); // importボタン
let isLoadLayer = true; // 読み込みの確認（初期値）

// Generate export blob
function generateExBlob(masu) {
    // マス目の配列をJSON形式の文字列に変換
    const jsonData = JSON.stringify(masu, null, 2); 

    // Blobを作成
    const blob = new Blob([jsonData], {type: 'application/json;charset=utf-8'});

    return blob;
}

// 保存（Export）
exportBtn.addEventListener('click', (e) => {
    if (!isLoadLayer) { // 読み込みの確認
        return;
    }

    if (!confirm('データを保存しますか？')) { // データ保存の確認
        e.preventDefault();

        return;
    };

    const layer = lConfig[activeLayer];
    const masu = layer.masuObj.grid; // マス目の配列

    if (!checkHexColors(masu)) { // 色とnullを確認
        console.error('Invalid data.')
        alert('保存できませんでした。');
        e.preventDefault();

        return;
    }

    // リンク先を作成
    const blob = generateExBlob(masu);
    const urlObj = URL.createObjectURL(blob); // オブジェクトURLを生成

    // ダウンロード設定
    e.target.href = urlObj;
    e.target.download = activeLayer + '_' + gridCount + '_' + getHiduke() + '.json';

    // リソースを解放
    setTimeout(() => {
        URL.revokeObjectURL(urlObj);
    }, 1000);
});

// Import data drawing function
function importDraw(ctx, masuObj, unre) {
    const masu = masuObj.grid; // マス目の配列

    // ドットの描画
    for (let i = 0; i < gridCount; i++) {
        for (let j = 0; j < gridCount; j++) {
            if (masu[i][j] !== null) {
                ctx.fillStyle = masu[i][j];
                ctx.fillRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
            } else {
                ctx.clearRect(i * gridWidth, j * gridWidth, gridWidth, gridWidth);
            }
        }
    }

    // 状態の格納（アンドゥ／リドゥ）
    const copy = masu.map(row => [...row]);
    unre.store(copy);
}

// 読み込み（Import）
importBtn.addEventListener('change', (e) => {
    const file = e.target.files[0]; // 選択されたファイルを取得

    if (file) {
        const reader = new FileReader();
        isLoadLayer = false; // 読み込み開始

        // ファイルをテキストとして読み込む
        reader.readAsText(file);

        // ファイル読み込み完了時の処理
        reader.addEventListener('load', (e) => {
            try {
                const jsonData = JSON.parse(e.target.result); // JSONに変換

                // ファイルの検証
                if (checkTwoDimensional(jsonData) === false) { // 配列かどうかを確認
                    throw new TypeError('Data is not an array.');
                }

                if (checkGridSize(jsonData, gridCount) === false) { // マス目の数を確認
                    throw new RangeError('Number of grids do not match.');
                }

                if (checkHexColors(jsonData) === false) { // 16進数の色指定を確認
                    throw new TypeError('Invalid color format.');
                }

                // 読み込んだデータの描画
                const layer = lConfig[activeLayer];
                layer.masuObj.grid = jsonData; // マス目の配列に渡す
                importDraw(layer.ctx, layer.masuObj, layer.unre); // 描画処理
            } catch (error) { // エラー処理
                console.error('Failed to load: ', error);
                alert('ファイルの読み込みに失敗しました。');
            }

            isLoadLayer = true; // 読み込み終了
        });
    } else {
        console.log('File not selected.');
    }

    e.target.value = ''; // 読み込みファイルの初期化
});

/**
 * Other settings (experiment)
 */
// 開閉ボタン
const exptOp = document.getElementById('expt-op'); // 開閉ボタン
const exptMenu = document.getElementById('expt-menu'); // 項目
exptOp.addEventListener('click', (e) => {
	exptMenu.classList.toggle('open');
});

/**
 * Background image
 */
const insHaikei = document.getElementById('ins-haikei'); // 背景画像の設定
const dispHaikei = document.getElementById('disp-haikei'); // 背景画像の表示ボタン
let showHaikei = true; // 背景画像を表示するかどうか（初期値）

// 背景画像の設定
insHaikei.addEventListener('change', (e) => {
    const file =  e.target.files[0]; // 選択されたファイルを取得

    if (file) {
        const urlObj = URL.createObjectURL(file); // オブジェクトURLを生成

        // 背景画像の作成
        const img = new Image();
        img.src = urlObj;
        img.id = 'haikei';

        // 背景画像の設定
        img.addEventListener('load', (e) => {
            // 背景画像を描画
            hCtx.clearRect(0, 0, hCanvas.width, hCanvas.height);
            hCtx.drawImage(img, 0, 0, hCanvas.width, hCanvas.height);

            // 背景画像の表示
            if (showHaikei) {
                hCanvas.classList.remove('hide');
            } else {
                hCanvas.classList.add('hide');
            }

            insHaikei.value = ''; // 読み込みファイルの初期化
        });
    }
});

// 背景画像の表示
dispHaikei.checked = showHaikei; // 初期値
dispHaikei.addEventListener('click', (e) => {
    showHaikei = e.target.checked;
    if (showHaikei) {
        hCanvas.classList.remove('hide');
    } else {
        hCanvas.classList.add('hide');
    }
});

/**
 * Dot drawing function
 */
function dotDraw(canvas, ctx, masuObj, unre) {
    let tapX = 0; // キャンバス要素内でのX座標
    let tapY = 0; // キャンバス要素内でのY座標
    let isTap = false; // タップしているかどうか
    let isValid = false; // 有効かどうか
    let masu = []; // マス目の配列
    ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア

    // mousedownのイベントハンドラ
    function handleMouseDown(e) {
        if (e.touches) { // タッチに対応
            e = e.changedTouches[0];
        }

        if (!isLoadLayer) { // 読み込みの確認
            return;
        }

        if (activeLayer === canvas.id) { // アクティブレイヤーの確認
            const rect = e.target.getBoundingClientRect();
            tapX = e.clientX - rect.left;
            tapY = e.clientY - rect.top;
            isTap = true; // タップした

            masu = masuObj.grid; // マス目の配列の再取得

            // マス目を計算
            const gridX = Math.floor(tapX / gridWidth);
            const gridY = Math.floor(tapY / gridWidth);

            // ドットの描画
            if (dState === 'draw') {
                if (masu[gridX][gridY] !== dotColor) {
                    ctx.fillStyle = dotColor;
                    ctx.fillRect(gridX * gridWidth, gridY * gridWidth, gridWidth, gridWidth);
                    masu[gridX][gridY] = dotColor;
                    isValid = true; // 有効
                }
            } else { // 消す
                if (masu[gridX][gridY] !== null) {
                    ctx.clearRect(gridX * gridWidth, gridY * gridWidth, gridWidth, gridWidth);
                    masu[gridX][gridY] = null;
                    isValid = true; // 有効
                }
            }
        }
    }

    // mousemoveのイベントハンドラ
    function handleMouseMove(e) {
        if (e.touches) { // タッチに対応
            if (e.touches.length > 1) { // 2本指以上の場合
                return;
            }
            
            e.preventDefault(); // 規定の動作を抑止する
            e = e.changedTouches[0];
        }

        if (e.buttons !== 0 && isTap === true) { // タップを確認
            const rect = e.target.getBoundingClientRect();
            tapX = e.clientX - rect.left;
            tapY = e.clientY - rect.top;
            
            // マス目を計算
            const gridX = Math.floor(tapX / gridWidth);
            const gridY = Math.floor(tapY / gridWidth);

            // ドットの描画
            if (dState === 'draw') {
                if (masu[gridX][gridY] !== dotColor) {
                    ctx.fillStyle = dotColor;
                    ctx.fillRect(gridX * gridWidth, gridY * gridWidth, gridWidth, gridWidth);
                    masu[gridX][gridY] = dotColor;
                    isValid = true; // 有効
                }
            } else { // 消す
                if (masu[gridX][gridY] !== null) {
                    ctx.clearRect(gridX * gridWidth, gridY * gridWidth, gridWidth, gridWidth);
                    masu[gridX][gridY] = null;
                    isValid = true; // 有効
                }
            }
        }
    }

    // mouseupのイベントハンドラ
    function handleMouseUp(e) {
        if (isTap === true && isValid === true) { // 有効を確認
            // 状態の格納（アンドゥ／リドゥ）
            const copy = masu.map(row => [...row]);
            unre.store(copy); // 格納

            isTap = false;
            isValid = false;
        }
    }

    // mouseoutのイベントハンドラ
    function handleMouseOut(e) {
        e.preventDefault(); // 規定の動作を抑止する
        
        if (isTap === true && isValid === true) { // 有効を確認
            // 状態の格納（アンドゥ／リドゥ）
            const copy = masu.map(row => [...row]);
            unre.store(copy); // 格納

            isTap = false;
            isValid = false;
        }
    }

    // クリックイベントの規定の動作を抑止する
    canvas.addEventListener('click', (e) => {
        e.preventDefault(); // 規定の動作を抑止する
    });

    // イベントの登録
    if (window.ontouchstart === undefined) {
        // マウスイベント
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('mouseout', handleMouseOut);

        // イベントを削除する関数を返す
        return function removeListeners() {
            canvas.removeEventListener('mousedown', handleMouseDown);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('mouseout', handleMouseOut);
        };
    } else {
        // タッチイベント
        canvas.addEventListener('touchstart', handleMouseDown);
        canvas.addEventListener('touchmove', handleMouseMove, {passive: false});
        canvas.addEventListener('touchend', handleMouseUp);
        canvas.addEventListener('touchcancel', handleMouseOut, {passive: false});

        // イベントを削除する関数を返す
        return function removeListeners() {
            canvas.removeEventListener('touchstart', handleMouseDown);
            canvas.removeEventListener('touchmove', handleMouseMove, {passive: false});
            canvas.removeEventListener('touchend', handleMouseUp);
            canvas.removeEventListener('touchcancel', handleMouseOut, {passive: false});
        };
    }
}

/**
 * Data validation function
 */
// Check if it is a 2D array
function checkTwoDimensional(data) {
    if (Array.isArray(data) === false) { // 配列ではない場合
        return false;
    }

    return data.every(item => Array.isArray(item)); // 各要素が配列か確認
}

// Check number of grids
function checkGridSize(data, size) {
    return data.length === size && data.every(item => item.length === size); // 配列の長さを確認
}

// Check hex color code and check if all are null
function checkHexColors(data) {
    let allNull = true; // すべてnullかどうか
    for (const item of data) {
        for (const value of item) {
            if (value !== null) { // nullでなかった場合
                allNull = false;
            }

            if (!isHexColor(value)) {
                return false; // 一つでも不正な値があればfalseを返す
            }
        }
    }

    return !allNull; // すべてnullならfalse, そうでなければtrueを返す
}

// Validate hex color code
function isHexColor(value) {
    if (value === null) {
        return true; // nullならtrueを返す
    }

    const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;
    return hexColorRegex.test(value);
}

// Check if all are null
function checkAllNull(data) {
    return data.every(item => item.every(value => value === null));
}

/**
 * Class of grid array
 */
class GridArray {
    constructor(gridCount) {
        if (!Number.isInteger(gridCount) || gridCount <= 0) { // 0以下や小数の場合
            throw new Error('Not positive integer.');
        }

        this.gridCount = gridCount; // グリッドサイズ
        this.grid = Array.from({length: gridCount}, () => Array(gridCount).fill(null)); // マス目の配列
    }

    // 配列を初期化する
    reset(newgridCount = this.gridCount, value = null) {
        if (!Number.isInteger(newgridCount) || newgridCount <= 0) { // 0以下や小数の場合
            throw new Error('Not positive integer.');
        }

        this.gridCount = newgridCount;
        this.grid = Array.from({length: this.gridCount}, () => Array(this.gridCount).fill(value));
    }
}

/**
 * Class of undo redo array
 */
class UndoRedoArray {
    constructor() {
        this.undoStack = []; // アンドゥ用の配列
        this.redoStack = []; // リドゥ用の配列
    }

    // 状態の格納
    store(state) {
        this.undoStack.push(state); // アンドゥ配列に追加
        this.redoStack = []; // リドゥ配列を空にする
    }

    // アンドゥ／リドゥ配列の初期化
    reset() {
        this.undoStack = [];
        this.redoStack = [];
    }

    // アンドゥ操作
    undo() {
        if (this.undoStack.length === 0) {
            return null;
        }

        const state = this.undoStack.pop(); // アンドゥ配列から状態を取得
        this.redoStack.push(state); // リドゥ配列に追加

        return state;
    }

    // リドゥ操作
    redo() {
        if (this.redoStack.length === 0) {
            return null;
        }

        const state = this.redoStack.pop(); // リドゥ配列から状態を取得
        this.undoStack.push(state); // アンドゥ配列に追加

        return state;
    }

    // undoStackの要素数を取得する
    get undoCount() {
        return this.undoStack.length;
    }

    // redoStackの要素数を取得する
    get redoCount() {
        return this.redoStack.length;
    }
}

/**
 * Class of layer management
 */
class LayerManager {
    constructor(canvas, dispLayerBtn, layerItem, gridCount) {
        if (!canvas) {
            throw new Error('No Canvas.');
        }

        if (!dispLayerBtn || typeof dispLayerBtn.checked === 'undefined') {
            throw new Error('Not checkbox element.');
        }

        this.cvs = canvas; // レイヤー用キャンバス
        this.ctx = canvas.getContext('2d', {willReadFrequently: true}); // コンテキスト
        this.masuObj = new GridArray(gridCount); // マス目の配列の生成
        this.unre = new UndoRedoArray(); // アンドゥ／リドゥの配列の生成
        this.dispL = dispLayerBtn; // レイヤー表示のボタン
        this.lItem = layerItem; // レイヤーアイテム
        this.removeListeners = this.registerDotDraw(); // 描画処理の設定
    }

    // 描画処理のイベントリスナーの登録
    registerDotDraw() {
        return dotDraw(this.cvs, this.ctx, this.masuObj, this.unre);
    }

    // 各種リセット
    reset(gridCount) {
        this.masuObj.reset(gridCount);
        this.unre.reset();
        this.removeListeners(); // イベントリスナーの削除
        this.removeListeners = this.registerDotDraw(); // 描画処理の再設定
    }

    // 表示の確認
    get disp() {
        return this.dispL.checked;
    }
}

/**
 * load event
 */
const lConfig = {}; // レイヤーの管理用

window.addEventListener('load', (e) => {
    if (!gCanvas.getContext) { // コンテキストの有無を確認する
        console.log('No Canvas.');

        return;
    }

    // レイヤーの管理設定
    lConfig.layer1 = new LayerManager(layers[0], dispLayerBtns[0], layerItems[0], gridCount);
    lConfig.layer2 = new LayerManager(layers[1], dispLayerBtns[1], layerItems[1], gridCount);
    lConfig.layer3 = new LayerManager(layers[2], dispLayerBtns[2], layerItems[2], gridCount);

    // グリッド線の描画
    gridLineDraw(gCanvas, gCtx, gridColor);
});
