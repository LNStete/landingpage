// 2023-05-04
// p5Lightex.

// foxIAになったんだっけ。exIAはもう死んだ。
// まあ、気が向いたら復活させればいいや。どうせ誰も見ないでしょ？

// EasyImageとかいろいろ死んだ

// 2023-11-20
// foxIAの仕様変更にともなうバグを修正
// 上下に描画するアイデアを導入
// 参考：https://qiita.com/inaba_darkfox/items/af1aaea412ef43bb718e
// 1.8,0に更新
// しません。1.7.0まででいいです。pagurekが_triangulateをまたいじくりまわしたせいで
// evenoddが死んでますね。おそらくcontourほにゃららが原因だと思う。
// まあ実質1.7.0がいわゆるstableって感じだし。1.8はバグだらけで実験用って感じだし。
// 1.7.0まででいいと思います。

// 結論が出ました。バグではないそうです。
// それでは困るので、このスケッチは永久に1.7.0です。
// 以上

// sayoさんの元ネタ：https://openprocessing.org/sketch/1412630

// 2024-05-20
// 自作テッセレーションで書き換え
// bgCam不要
// 自作テッセレートなので1.9.3でもevenoddが適用されます
// OK!
// というわけで1.9.3にしました

// 2024-05-21
// カリングの問題を修正しました

// 2024-05-28
// 1.9.4
// もう_triangulateがどんなにおかしくなろうが
// 知ったこっちゃないです

// forkを非公開にする変な人がいるんだけど
// Openだよね。Openって名前付いてるよね？
// 喧嘩売ってんのかな
// まあ、いいけどね。知らんわ。

// ちなみにこれ独自の外部ライブラリに頼ってるから
// こっちの都合次第では崩壊するけど。
// まあ、どうでもいいわな。

// --------------------------------------------------------------- //
// setting.
// 必須。ただしライブラリには含めず、外から指示する方向で。
document.oncontextmenu = (e) => { e.preventDefault(); }

// --------------------------------------------------------------- //
// global.

let IA;

let bg, info;
let baseCloud, cloudImg;
let geomId = 0;
let shapes;

// --------------------------------------------------------------- //
// loading.

// 毎度おなじみループ雲画像（便利）
function preload(){
  cloudImg = loadImage("https://inaridarkfox4231.github.io/assets/texture/cloud.png");
}

// --------------------------------------------------------------- //
// main.

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  pixelDensity(1);
  
  // これでいいの？？
  IA = new foxIA.Interaction(this.canvas, {factory:(function (){
    return new ShapePointer(this.width, this.height, this._renderer);
  }).bind(this)});
  // 初期化したら後には戻れない...
  //IA.initialize(this.canvas); // canvasで初期化
  
  fill(255);
  noStroke();
  
  shapes = new CrossReferenceArray();
  
  bg = createGraphics(width, height); // bg.
  baseCloud = createGraphics(width, height, WEBGL); // baseCloud.

  info = createGraphics(width, height); // info.
  info.textStyle(ITALIC);
  info.translate(width / 2, height / 2);

  // カリングを適用します
  // テッセレーションのサブデータとして島の輪郭を取得できるんですが
  // それが時計回りなので
  // それを使って側面をテッセレートします
  // これによりちゃんと側面が時計回りになりますね
  // なおこの手の（contourを時計回りに取得する）技術は現行のp5にはないです
  // 自前で作るしかない
  // もっというとこの手のスケッチが目的、かつカリング無視すれば要らないんですが
  // 輪郭線でなんかしたい場合に方法が無いんですよ
  const gl = this._renderer.GL;
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.FRONT);
}

function draw() {
  shapes.loop("updateMove");

  clear();
  
  drawBackground(width, height, millis()/12000, millis()/16000);

  directionalLight(128, 128, 128, 0.5, 0.5, -1);
  ambientLight(128);

  specularMaterial(64);
  shapes.loop("display");
  
  info.clear();
  shapes.loop("drawGuide", [info]);
  if (shapes.length===0) {
    const TEXT_SIZE = min(width, height)*0.04;
    info.fill(0);
    info.noStroke();
    info.textSize(min(width, height)*0.04);
    info.textAlign(CENTER, CENTER);
    info.text("Draw a shape.", 0, -TEXT_SIZE*0.65);
    info.text("Mouse, stylus pen and touch are available.", 0, TEXT_SIZE*0.65);
  } else {
    info.noStroke();
    info.fill(0);
    info.textAlign(LEFT, TOP);
    info.textSize(18);
    info.text(frameRate().toFixed(3), -width/2 + 5, -height/2 + 5);
  }

  // どれよりも上に描画する. bgCam? そんなものいらないわ

  push();
  camera(0,0,1,0,0,0,0,1,0);
  ortho(-1,1,-1,1,0,1);
  translate(0,0,1);
  noLights();
  texture(info);
  plane(2);
  pop();

  shapes.loopReverse("remove");
}

// 動く雲画像
function drawBackground(w, h, s, t){
  s = fract(s);
  t = fract(t);
  baseCloud.texture(cloudImg);
  baseCloud.textureMode(NORMAL);
  baseCloud.textureWrap(REPEAT);
  const wRatio = w/(3*cloudImg.width);
  const hRatio = h/(3*cloudImg.height);
  baseCloud.beginShape();
  baseCloud.vertex(-w/2, -h/2, s, t);
  baseCloud.vertex(w/2, -h/2, s + wRatio, t);
  baseCloud.vertex(w/2, h/2, s + wRatio, t + hRatio);
  baseCloud.vertex(-w/2, h/2, s, t + hRatio);
  baseCloud.endShape();
  bg.blendMode(BLEND);
  bg.image(baseCloud, 0, 0);
  bg.blendMode(SCREEN);
  bg.background(64, 128, 255);

  // どれよりも下に描画する. bgCam要らん。
  push();
  camera(0,0,1,0,0,0,0,1,0);
  ortho(-1,1,-1,1,0,1);
  noLights();
  texture(bg);
  plane(2);
  pop();
}

// --------------------------------------------------------------- //
// createShape3D.

// utility for create shapes.
function findCenter(vectors) {
  const center = createVector();
  for (let i = 0; i < vectors.length; i++) {
    center.add(vectors[i]);
  }
  center.div(vectors.length);

  for (let i = 0; i < vectors.length; i++) {
    vectors[i].sub(center);
  }

  return center;
}

function createShape3D(gId, vectors){
  const geom = new p5.Geometry();

  const z1 = new p5.Vector(0, 0, 20);
  const z2 = new p5.Vector(0, 0, -20);
  let index = 0;
  
  // 表面・裏面
  // vectorsは2次元ベクトルの集合
  // これをテッセレートすればOK
  // 三角形の頂点を順番に並べればOK

  evenlySpacing(vectors, {minLength:24,closed:true});
  quadBezierize(vectors, {detail:8, closed:true});
  evenlySpacing(vectors, {minLength:12,closed:true});

  // わたしのテッセレーションアルゴリズム
  const tessResult = myTessellation(vectors);
  const tessTriangles = tessResult.tess;
  const tessSegments = tessResult.seg;
  const tesselateVertices = [];
  for(let i=0; i<tessTriangles.length; i+=2){
    tesselateVertices.push(createVector(tessTriangles[i],tessTriangles[i+1],0));
  }
  //console.log(tessTriangles.length/6);
  
  //let oldTessResult = this._renderer._triangulate(verticesToArray(vectors));
  //console.log(oldTessResult.length/36);
  //tesselateVertices = arrayToVertices(tesselateVertices);
  //tesselateVertices = verticesFilter(tesselateVertices);

  for (let i=0; i<tesselateVertices.length; i++) {
    geom.vertices.push(p5.Vector.add(tesselateVertices[i], z1));
  }
  for (let i=0; i<tesselateVertices.length; i++) {
    geom.vertices.push(p5.Vector.add(tesselateVertices[tesselateVertices.length-(i+1)], z2));
  }

  for (let i=0; i<tesselateVertices.length * 2; i+=3) {
    geom.faces.push([i, i+1, i+2]);
  }

  index = tesselateVertices.length * 2;

  // 側面
  // tessSegmentsのsegmentごとに作る必要があるね
  for(const segment of tessSegments) {
    for(let k=0; k<segment.length; k++){
      const v = segment[k];
      geom.vertices.push(p5.Vector.add(v, z1));
     geom.vertices.push(p5.Vector.add(v, z2));
    }
    const len = segment.length * 2;
    for (let i=0; i<len; i+=2) {
      geom.faces.push([index + i,         index + i+1,       index + (i+2)%len]);
      geom.faces.push([index + (i+3)%len, index + (i+2)%len, index + i+1]);
    }
    index += len;
  }

  // 法線・辺計算
  geom.computeNormals();
  geom._makeTriangleEdges()._edgesToVertices();

  // バッファ作成
  this._renderer.createBuffers(gId, geom);
}

function verticesToArray(vertices) {
  const all_array = [];

  const array = [];
  for (let ver of vertices) {
    // ここを長さ12にする必要があるみたいです（テスト済み）
    array.push(ver.x, ver.y, ver.z);
    // ダミーを9個挿入
    for(let k=0; k<9; k++){ array.push(0); }
  }
  all_array.push(array);

  return all_array;
}


function arrayToVertices(array) {
  let vertices = [];

  // +3を+12にしてあとは多分同じ
  for (let i=0; i<array.length; i+=12) {
    vertices.push(createVector(array[i], array[i+1], array[i+2]));
  }

  return vertices;
}

// 三角形がつぶれる場合にそれを排除する的な感じのようですね。
function verticesFilter(vertices) {
  const filtered = [];
  for (let i = 0; i < vertices.length; i += 3) {
    const ba = p5.Vector.sub(vertices[i+1], vertices[i]);
    const bc = p5.Vector.sub(vertices[i+1], vertices[i+2]);
    const cross = p5.Vector.cross(ba, bc);
    
    if (p5.Vector.mag(cross) != 0) {
      filtered.push(vertices[i], vertices[i+1], vertices[i+2]);
    }
  }
  
  return filtered;
}

// --------------------------------------------------------------- //
// Pointer.

// PointerPrototypeの継承
// ShapeMeshをインタラクションによりジェネレートするユニット。
// うまくいきましたね。
class ShapePointer extends foxIA.PointerPrototype{
  constructor(w, h, _gl){
    super();
    this.w = w;
    this.h = h;
    this.renderer = _gl;
    this.shape = undefined;
  }
  mouseDownAction(e){
    this.shape = new ShapeMesh(this.renderer);
    this.shape.initialize(this.x - this.w/2, this.y - this.h/2);
    shapes.add(this.shape); // ほんとはクラス名Shape3Dにしたいんですけどね
  }
  mouseMoveAction(e){
    this.shape.addVertex(this.x - this.w/2, this.y - this.h/2);
  }
  mouseUpAction(){
    this.shape.complete();
  }
  touchStartAction(t){
    this.shape = new ShapeMesh(this.renderer);
    this.shape.initialize(this.x - this.w/2, this.y - this.h/2);
    shapes.add(this.shape); // ほんとはクラス名Shape3Dにしたいんですけどね
  }
  touchMoveAction(t){
    this.shape.addVertex(this.x - this.w/2, this.y - this.h/2);
  }
  touchEndAction(t){
    this.shape.complete();
  }
}


// --------------------------------------------------------------- //
// shape3D.

// ShapeMesh(shape3D)
// addVertexはマウスないしはタッチポインタが動くたびに呼び出せばいい
// drawGuideは毎フレームですね
// 要するに発火時に両方に登録するわけ
class ShapeMesh{
  constructor(_gl){
    this.active = false;
    this.closed = false;
    this.completed = false;
    this.vectors = [];
    this.position = createVector();
    this.movingSpeed = 0;
    this.rotation = 0;
    this.rotationSpeed = 0;
    this.shapeColor = color(0); // 描画中の色
    this.life = 3;
    this.alive = true;
    this.gId = -1;
    this.renderer = _gl;
  }
  kill(){
    this.alive = false;
  }
  initialize(x, y){
    // x,yは事前にセンタリング済み
    this.active = true;
    this.vectors.push(createVector(x, y, 0));
  }
  addVertex(x, y){
    if(this.completed){ return; }
    // x,yは事前にセンタリング済み
    // closedでない場合のみ発動
    if (!this.closed) {
      const v = createVector(x, y, 0);
      if (this.vectors.length > 10 && v.dist(this.vectors[0]) < 20) {
        // 頭とおしりがくっつくときに閉じるみたいですね
        // 短すぎると登録できないようです（すぐに閉じるのを防ぐ）
        this.closed = true;
        // 閉じたときに色を決める
        const col = hsv2rgb(Math.random(), 1, 1);
        this.shapeColor = color(col.r*255, col.g*255, col.b*255);
      } else if (this.vectors.length > 0 && v.dist(this.vectors[this.vectors.length - 1]) > 10) {
        // 前の点からある程度離れているときに追加するみたい
        // 10は長すぎる気もするけど
        this.vectors.push(v);
      }
    }
  }
  drawGuide(gr){
    if(this.completed){ return; }
    gr.fill(this.shapeColor);
    // 閉じている場合に色を変える
    gr.stroke(this.shapeColor);
    gr.strokeWeight(4);
    gr.circle(this.vectors[0].x, this.vectors[0].y, 10);

    gr.noFill();

    gr.beginShape();
    for (let i = 0; i < this.vectors.length; i++) {
      gr.vertex(this.vectors[i].x, this.vectors[i].y);
    }
    // 閉じてない場合は円を描く
    if(this.closed) {
      gr.endShape(CLOSE);
    } else {
      gr.endShape();
      gr.fill(this.shapeColor);
      gr.circle(
        this.vectors[this.vectors.length - 1].x,
        this.vectors[this.vectors.length - 1].y,
        10
      );
    }
  }
  complete(){
    this.active = false;
    if(this.closed){
      // shapeのgeometryを構成する
      this.createShape();
      this.completed = true;
    }else{
      // closedでないのにcomplete処理が行われたら排除
      this.kill();
    }
  }
  createShape(){
    this.position = findCenter(this.vectors);
    this.movingSpeed = (random() < 0.5 ? 1 : -1) * random(0.1, 0.2);
    this.rotationSpeed = (random() < 0.5 ? 1 : -1) * random(0.02, 0.05) / 16;
    this.gId = `shape3D${geomId}`;
    geomId++;
    createShape3D(this.gId, this.vectors); // これをmodelで描画する
  }
  updateMove(){
    if(!this.completed){ return; }
    this.position.y += deltaTime * this.movingSpeed
    this.rotation += deltaTime * this.rotationSpeed;
    const SIZE_SCALE = min(width, height);
    // 画面外に出たら排除
    if(this.position.y < -height*2){
      this.position.x = random(-width/2, width);
      this.position.y = height*2;
      this.position.z -= SIZE_SCALE;
      this.life--;
    }else if(this.position.y > height*2){
      this.position.x = random(-width/2, width);
      this.position.y = -height*2;
      this.position.z -= SIZE_SCALE;
      this.life--;
    }
    if(this.life===0){ this.kill(); }
  }
  display(){
    if(!this.completed){ return; }
    ambientMaterial(this.shapeColor);
    translate(this.position);
    rotateY(this.rotation);
    //shape3D(i);
    this.renderer.drawBuffers(this.gId);
    resetMatrix();
  }
  remove(){
    if(!this.alive){
      // crossReferenceArrayを使って排除する
      // 閉じずに開いた場合もこれでkillすればいいわね
      shapes.remove(this);
    }
  }
}

// --------------------------------------------------------------- //
// utility.

// CrossReferenceArray.
class CrossReferenceArray extends Array{
  constructor(){
    super();
  }
  add(element){
    this.push(element);
    element.belongingArray = this; // 所属配列への参照
  }
  addMulti(elementArray){
    // 複数の場合
    elementArray.forEach((element) => { this.add(element); })
  }
  remove(element){
    let index = this.indexOf(element, 0);
    this.splice(index, 1); // elementを配列から排除する
  }
  loop(methodName, args = []){
    if(this.length === 0){ return; }
    // methodNameには"update"とか"display"が入る。まとめて行う処理。
    for(let i = 0; i < this.length; i++){
      this[i][methodName](...args);
    }
  }
  loopReverse(methodName, args = []){
    if(this.length === 0){ return; }
    // 逆から行う。排除とかこうしないとエラーになる。もうこりごり。
    for(let i = this.length - 1; i >= 0; i--){
      this[i][methodName](...args);
    }
  }
  clear(){
    this.length = 0;
  }
}

function hsv2rgb(h, s, v){
  h = constrain(h, 0, 1);
  s = constrain(s, 0, 1);
  v = constrain(v, 0, 1);
  let _r = constrain(abs(((6 * h) % 6) - 3) - 1, 0, 1);
  let _g = constrain(abs(((6 * h + 4) % 6) - 3) - 1, 0, 1);
  let _b = constrain(abs(((6 * h + 2) % 6) - 3) - 1, 0, 1);
  _r = _r * _r * (3 - 2 * _r);
  _g = _g * _g * (3 - 2 * _g);
  _b = _b * _b * (3 - 2 * _b);
  let result = {};
  result.r = v * (1 - s + s * _r);
  result.g = v * (1 - s + s * _g);
  result.b = v * (1 - s + s * _b);
  return result;
}

// ---------------------------------------------------------
// utility.

// 三角形の面積がめちゃ小さい場合にfalse、そういう閾値
function insideTriangle(p0,p1,p2,p, threshold = 1e-9){
  // pがp0,p1,p2の三角形の内部にあるかどうか調べるだけ
  // ベクトルを使った方が分かりやすいけどね。
  const a11 = Math.pow(p1.x-p0.x,2) + Math.pow(p1.y-p0.y,2);
  const a12 = (p1.x-p0.x)*(p2.x-p0.x) + (p1.y-p0.y)*(p2.y-p0.y);
  const a22 = Math.pow(p2.x-p0.x,2) + Math.pow(p2.y-p0.y,2);
  const qDotU = (p1.x-p0.x)*(p.x-p0.x) + (p1.y-p0.y)*(p.y-p0.y);
  const qDotV = (p2.x-p0.x)*(p.x-p0.x) + (p2.y-p0.y)*(p.y-p0.y);
  const d = a11*a22-a12*a12;
  if (abs(d) < threshold) return {flag:false,a:-1,b:-1};
  const a = a22*qDotU - a12*qDotV;
  const b = -a12*qDotU + a11*qDotV;
  if(a>0 && b>0 && a+b<d) return {flag:true, a:a/d, b:b/d};
  return {flag:false,a:a/d,b:b/d};
}

// んー
// まず隣接する3つの点を
// 内角ですね...
// どっち回りかわからんのでそれを判定するためにですね
// ベクトル
// p0 -> p1 -> p2において
// p0->p1をp1->p2に重ねる-PI～PIの角度を調べるわけ
// 外積と内積でatan2するだけなんだが...
// これの符号が重要なんですね
// sinの値が閾値以下の場合...
// cosで0付近かPI付近か調べる
// 0付近の場合はほぼまっすぐということで
// 中間点をはじいて点の数を減らし続きの処理を実行する
// PI付近の場合は行って帰る感じなので
// これもやはり突き出しは無視しましょうということで
// どっちの場合も中間点を弾いて続きの処理を実行しますね
// どっちでもなければ符号が確定するので
// 値を放り込みつつ
// 総和を調べる。
// この処理は単純閉曲線（折れ線）であることを前提としているので
// 総和は常にTAUか-TAUにならなければならない
// TAUである場合、折れる角度が正なら内角、負なら外角。
// -TAUである場合、折れる角度が負なら内角、以下略
// だから総和の符号だけ見ればいい
// なおすべて同符号の場合は凸であるので
// 凸の場合の処理を実行してそのまま抜ける。
// 三角形の点の並びはすべて長さ6の配列で、時計回りに並ぶものとする
// 総和の符号と一致している場合に内角扱いするが、その際回る角度が正であれば
// そのままp0,p1,p2の順に入れればよい
// 負である場合はp0.p2,p1の順に入れる。以上。
function simpleEarcutCaseThree(points, threshold = 1e-9){
  // 3点のケース
  // 順番だけ調べる
  // 小さすぎる場合は無視
  const p = points[0];
  const q = points[1];
  const r = points[2];
  const cp = (q.x-p.x) * (r.y-p.y) - (q.y-p.y) * (r.x-p.x);
  if(abs(cp) < threshold) return [];
  // cp>0の場合、p,q,rで時計回り
  // cp<0の場合、p,r,qで時計回り
  if(cp>0) return [p.x,p.y,q.x,q.y,r.x,r.y];
  return [p.x,p.y,r.x,r.y,q.x,q.y];
}

// 凸単純閉曲線の三角形分割。線を引くだけ。
function getConvexFaces(points, orientation = 1){
  const result = [];
  const p = points[0];
  for(let i=1; i<points.length-1; i++){
    const q = points[i];
    const r = points[i+1];
    if(orientation > 0) {
      result.push(p.x,p.y,q.x,q.y,r.x,r.y);
    } else {
      result.push(p.x,p.y,r.x,r.y,q.x,q.y);
    }
  }
  return result;
}

function simpleEarcut(points, threshold = 1e-9){
  if (points.length < 3) { return []; }
  if (points.length === 3) {
    // 点の並びだけ調べる
    return simpleEarcutCaseThree(points, threshold);
  }
  // 4以上の場合は帰納法による
  // 下準備の過程で点を排除する場合には点の数を減らして再帰
  // 三角形を得たうえで点を排除するなら
  // 点が少ない場合の結果を再帰により取得したうえでそこに付け加えるものとする

  // 角度の総和と角度の列を用意
  const angleArray = [];
  let angleSum = 0;
  let signSum = 0; // 符号の和の絶対値をpoints.lengthと比較する
  // 角度を計算する
  // 2次元なのでangleBetweenが使えるかな...要らないか
  let crushedTriangleId = -1;
  for(let i=0; i<points.length; i++){
    const p = points[i];
    const q = points[(i+1)%points.length];
    const r = points[(i+2)%points.length];
    // p->qをq->rに重ねる際の角度の変化を記録していく
    const cp = (q.x-p.x) * (r.y-q.y) - (q.y-p.y) * (r.x-q.x);
    // 三角形がつぶれてる場合は中間点を排除して帰納法...
    if (abs(cp) < threshold) {
      crushedTriangleId = (i+1)%points.length;
      break;
    }
    const ip = (q.x-p.x) * (r.x-q.x) + (q.y-p.y) * (r.y-q.y);
    const angle = atan2(cp, ip);
    angleArray.push(angle);
    angleSum += angle;
    signSum += Math.sign(angle); // 1か-1を加えていく
  }
  if (crushedTriangleId >= 0) {
    const replica = points.slice();
    replica.splice(crushedTriangleId, 1);
    return simpleEarcut(replica);
  }
  // 凸の場合. 第2引数は符号で向きを表現するもの
  if(abs(signSum) === points.length) getConvexFaces(points, signSum);
  // クラッシュしない場合
  const orientation = Math.sign(angleSum); // 向き付け。1か-1
  // orientationを掛けて正なら第一の条件を満たす
  let earArray = []; // 確実に存在するが...バグを防ぐため、無ければ[]を返す。
  // 排除する点のidを記録しておく
  let cuttingEarId = -1;
  for(let i=0; i<points.length; i++){
    if(angleArray[i] * orientation < 0) continue;
    // p,q,rの三角形にそれ以外の点が入ってないか調べる。入っていればcontinue
    // なければ排除決定
    const p = points[i];
    const q = points[(i+1)%points.length];
    const r = points[(i+2)%points.length];
    let insidePointExist = false;
    for(let k=3; k<points.length; k++){
      const s = points[(i+k)%points.length];
      const result = insideTriangle(p,q,r,s);
      if(result.flag){
        insidePointExist = true;
        break;
      }
    }
    if(insidePointExist) continue;
    // angleArray[i]の符号に応じてearArrayを構成
    if(angleArray[i] > 0) {
      earArray.push(p.x,p.y,q.x,q.y,r.x,r.y);
    } else {
      earArray.push(p.x,p.y,r.x,r.y,q.x,q.y);
    }
    cuttingEarId = (i+1)%points.length;
    break;
  }
  if(earArray.length === 0) return []; // earcut失敗
  const replica = points.slice();
  replica.splice(cuttingEarId, 1);
  const subResult = simpleEarcut(replica, threshold);
  subResult.push(...earArray);
  return subResult;
}

function getDet2(a,b,c){
  return (c.x-a.x) * (c.y-b.y) - (c.x-b.x) * (c.y-a.y);
}

function getIntersection(a,b,c,d,threshold = 1e-9){
  // a,b,c,dは2次元ベクトル
  // a-b と c-dが交わるかどうか調べる
  const abc = getDet2(a,b,c);
  const abd = getDet2(a,b,d);
  const cda = getDet2(c,d,a);
  const cdb = getDet2(c,d,b);
  if (abc<0&&abd<0) return {flag:false};
  if (abc>0&&abd>0) return {flag:false};
  if (cda<0&&cdb<0) return {flag:false};
  if (cda>0&&cdb>0) return {flag:false};

  const abr = abs(abc) + abs(abd);
  const cdr = abs(cda) + abs(cdb);

  // 4点が一直線上にある場合は交わらない判定とする
  if (abr < threshold || cdr < threshold) return {flag:false};
  // a---cp---bの比率
  // c---cp---dの比率
  const ratioA = abs(cda)/cdr;
  const ratioC = abs(abc)/abr;

  // pには交差点を入れる
  return {
    flag:true, p:p5.Vector.lerp(a, b, ratioA), ratioA, ratioC
  };
}

// --------------------------------------------------------------- //
// UnionFind.

// 0,1,2,...,n-1をqueryでまとめる
// いくつの塊になったのかとそのレベルを返す感じ（lvで参照できる）
function getUnionFind(n, query){
  let parent = [];
  let rank = [];
  for(let i = 0; i < n; i++){
    parent.push(i);
    rank.push(0);
  }
  function Find(a){
    if(parent[a] == a){
      return a;
    }else{
      parent[a] = Find(parent[a]);
      return parent[a];
    }
  }
  function Union(a, b){
    let aRoot = Find(a);
    let bRoot = Find(b);
    if(rank[aRoot] > rank[bRoot]){
      parent[bRoot] = aRoot;
    }else if(rank[bRoot] > rank[aRoot]){
      parent[aRoot] = bRoot;
    }else if(aRoot != bRoot){
      parent[bRoot] = aRoot;
      rank[aRoot] = rank[aRoot] + 1;
    }
  }
  for(let i = 0; i < 2; i++){
    for(let q of query){
      Union(q[0], q[1]);
    }
  }
  let uf = [];
  for(let i = 0; i < n; i++){
    uf.push({id:i, pt:parent[i]});
  }
  uf.sort((x, y) => {
    if(x.pt < y.pt){ return -1; }
    if(x.pt > y.pt){ return 1; }
    return 0;
  });
  uf[0].lv = 0;
  let count = 1;
  for(let i = 1; i < n; i++){
    if(uf[i].pt == uf[i-1].pt){
      uf[i].lv = uf[i-1].lv;
    }else{
      uf[i].lv = uf[i-1].lv + 1;
      count++;
    }
  }
  uf.sort((x, y) => {
    if(x.id < y.id){ return -1; }
    if(x.id > y.id){ return 1; }
    return 0;
  });
  // 代表系の集合もあると便利だと思う。
  const represents = new Array(count);
  const members = new Array(count);
  for(let i=0; i<members.length;i++) members[i] = [];
  for(let x of uf){
    represents[x.lv] = x.pt;
    members[x.lv].push(x.id);
  }
  // uf:ユニオンファインド配列。
  // 各indexにはptとlvへの参照が入ってる
  // countは島の数
  // repはレベルからptへの参照。これあるだけでだいぶ違うと思う。
  // memは各々の島のメンバーの配列。これもあると便利そう。下処理でやるのは
  // 大変だし。つけるかどうかオプションにするかは応相談。
  return {uf:uf, count:count, rep:represents, mem:members};
}

// 等間隔化にもclosed optionを導入したいな
function evenlySpacing(points, options = {}){
  const {minLength = 1, closed = false} = options;
  // minLengthより長い長さがある場合に、点を挿入する
  let newPoints = [];
  newPoints.push(points[0]);

  for(let i=1; i<points.length; i++){
    // iとi-1の距離を調べてminより小さければそのままiを入れて終了
    // 大きければ間も含めていくつか点を入れる
    // ここも後ろから入れないとおかしなことになるので注意！！って思ったけど
    // ああそうか、バグの原因それか...このやり方なら問題ないです。
    const d = points[i].dist(points[i-1]);
    if (d < minLength) {
      newPoints.push(points[i]);
    } else {
      const m = Math.floor(d/minLength)+1;
      for(let k=1; k<=m; k++){
        newPoints.push(p5.Vector.lerp(points[i-1], points[i], k/m));
      }
    }
  }

  // openである場合に末尾に点を加える必要性
  const endPoint = newPoints[newPoints.length-1];

  // 線の長さの総和を求めると同時に長さの列を取得
  let lengthArray = [];
  for(let i=0; i<newPoints.length-1; i++){
    const d = newPoints[i].dist(newPoints[i+1]);
    lengthArray.push(d);
  }

  // minLengthを超えるたびにそれを引く、を繰り返す
  // もしくは？
  // lastPointという概念を用意。最初はnewPoints[0]から始める。
  // localSumが閾値未満であれば新しい点でlastPointをおきかえる
  // 超えた場合はlastPointと新しい点を(localSum-minLength)/distanceでlerpして
  // ??違う、(minLength-(localSum-distance))/distanceか。
  // あるいはlocalSum + distance > minLengthかどうか見るとか。<とか。
  let localSum = 0;
  const result = [newPoints[0]];
  const lastPoint = createVector();
  lastPoint.set(result[0]);
  for(let i=1; i<newPoints.length; i++){
    const distance = newPoints[i].dist(lastPoint);
    if (localSum + distance < minLength) {
      lastPoint.set(newPoints[i]);
      localSum += distance;
    } else {
      // オーバーした場合はlerpで該当する点を求める
      const ratio = (minLength-localSum)/distance;
      const middlePoint = p5.Vector.lerp(lastPoint, newPoints[i], ratio);
      result.push(middlePoint);
      lastPoint.set(middlePoint);
      // localSumを初期化
      localSum = 0;
    }
  }

  // closed caseでOKでした。オプション用意するの忘れてた。バカ。

  // pointsをresultで書き換える
  points.length = 0;
  for(let i=0; i<result.length; i++){
    points.push(result[i]);
  }

  // closedの場合はおしりもチェック...？？
  if (closed) {
    const endPoint = points[points.length-1];
    const beginPoint = points[0];
    const distance = endPoint.dist(beginPoint);
    if (distance > minLength) {
      // たとえば2.1と1の場合は3分割するが1.9と1の場合は2分割する
      const m = floor(distance/minLength) + 1;
      for(let k=1; k<m; k++){
        points.push(p5.Vector.lerp(endPoint, beginPoint, k/m));
      }
    }
  } else {
    // closedでない場合は末尾にあった点を補間する
    points.push(endPoint);
  }
}

// クワドベジエライズ
// 中点を取り、もともとの点を制御点とする
// openの場合は0のみ残し、0-1点と直線でつなぐ
// そしてL'-LとLを直線でつなぐ
// closedの場合は0-1からスタートし、最後に0=Lを制御点とし、L'-Lと0-1をベジエでつなぐ
// 感じですね。
function quadBezierize(points, options = {}){
  const {detail = 4, closed = false} = options;
  const subPoints = [];
  for(let i=0; i<points.length-1; i++){
    subPoints.push(p5.Vector.lerp(points[i], points[i+1], 0.5));
  }
  if (closed) {
    subPoints.push(p5.Vector.lerp(points[points.length-1], points[0], 0.5));
  }
  const result = [];
  if (!closed) {
    result.push(points[0]);
    result.push(subPoints[0]);
    for(let k=1; k<subPoints.length; k++){
      const p = subPoints[k-1];
      const q = points[k];
      const r = subPoints[k];
      for(let m=1; m<=detail; m++){
        const t = m/detail;
        result.push(createVector(
          (1-t)*(1-t)*p.x + 2*t*(1-t)*q.x + t*t*r.x,
          (1-t)*(1-t)*p.y + 2*t*(1-t)*q.y + t*t*r.y
        ));
      }
    }
    result.push(points[points.length-1]);
  } else {
    result.push(subPoints[0]);
    for(let k=1; k<=subPoints.length; k++){
      const p = subPoints[k-1];
      const q = points[k%subPoints.length];
      const r = subPoints[k%subPoints.length];
      for(let m=1; m<=detail; m++){
        const t = m/detail;
        if(m===detail&&k===subPoints.length)continue;
        result.push(createVector(
          (1-t)*(1-t)*p.x + 2*t*(1-t)*q.x + t*t*r.x,
          (1-t)*(1-t)*p.y + 2*t*(1-t)*q.y + t*t*r.y
        ));
      }
    }
  }
  points.length = 0;
  for(let i=0; i<result.length; i++) points.push(result[i]);
}

function myTessellation(points){

    const path = points;
    const crossPoints = [];

  const cpCheckArray = new Array(path.length);
  for(let i=0; i<path.length; i++) cpCheckArray[i] = [];
  
  for(let i=0; i<path.length; i++){
    for(let k=i+1; k<path.length; k++){ // 重複回避
      // 排除
      if ((i+1)%path.length===k) continue;
      if ((k+1)%path.length===i) continue;
      const ic = getIntersection(
        path[i], path[(i+1)%path.length], path[k], path[(k+1)%path.length]
      );
      if (ic.flag) {
        crossPoints.push(ic.p);
        cpCheckArray[i].push({p:ic.p, ratio:ic.ratioA});
        cpCheckArray[k].push({p:ic.p, ratio:ic.ratioC});
      }
    }
  }


  const newPoints = [];
  for(let i=0; i<path.length; i++){
    newPoints.push({p:path[i], cross:false});
    const cpa = cpCheckArray[i];
    if (cpa.length > 0) {
      // cpaをratioの小さい順にsortしてpoints[i]のあとに放り込んでいく
      cpa.sort((u, v) => {
        if (u.ratio < v.ratio) return -1;
        if (u.ratio > v.ratio) return 1;
        return 0;
      });
      for(let k=0; k<cpa.length; k++){
        newPoints.push({p:cpa[k].p, cross:true});
      }
    }
  }

  for(let i=0; i<newPoints.length; i++){
    newPoints[i].neighbor = [(i-1+newPoints.length)%newPoints.length,(i+1)%newPoints.length];
  }

  const query = [];
  for(let i=0; i<newPoints.length; i++){
    const p = newPoints[i];
    for(let k=i+1; k<newPoints.length; k++){
      const q = newPoints[k];
      if (!p.cross && !q.cross) continue;
      const d = p.p.dist(q.p);
      if (d < 1e-8) query.push([i,k]);
    }
  }

  const result = getUnionFind(newPoints.length, query);
    
  const mergedPoints = [];
  const mergedEdges = [];
    
  const uf = result.uf;
  for(let k=0; k<result.count; k++){
    const obj = {};
    obj.p = newPoints[result.rep[k]].p;
    obj.index = k;
    obj.neighbor = [];
    obj.indices = []; // あとで放り込む
    const m = result.mem[k];
    //console.log(m);
    for(let i of m){
      const p = newPoints[i];
      for(const n of p.neighbor){
        if (uf[i].lv !== uf[n].lv) {
          obj.neighbor.push(uf[n].lv);
          if (uf[i].lv < uf[n].lv) {
            mergedEdges.push({
              indices:[uf[i].lv, uf[n].lv], dirtyFlag:false
            });
          }
        }
      }
    }
    mergedPoints.push(obj);
  }

  // xMinでedgesをソート
  for(const e of mergedEdges){
    const p = mergedPoints[e.indices[0]];
    const q = mergedPoints[e.indices[1]];
    e.xMin = min(p.p.x, q.p.x);
    e.xMinIndex = (p.p.x < q.p.x ? p.index : q.index);
  }
  mergedEdges.sort((e0,e1) => {
    if (e0.xMin < e1.xMin) return -1;
    if (e0.xMin > e1.xMin) return 1;
    return 0;
  });
  // 頂点に接続辺のindexを集める
  for(let k=0; k<mergedEdges.length; k++){
    const e = mergedEdges[k];
    e.index = k;
    const p = mergedPoints[e.indices[0]];
    const q = mergedPoints[e.indices[1]];
    p.indices.push(k);
    q.indices.push(k);
  }

  // 接続辺の配列を反時計回りにソートする
  // 行き先の頂点と差を取ってatan2して逆順に並べるだけ
  // 常に偶数長さ。
  for(let i=0; i<mergedPoints.length; i++){
    const p = mergedPoints[i];
    const l = p.indices.length;
    p.indices.sort((i0, i1) => {
      const e0 = mergedEdges[i0];
      const e1 = mergedEdges[i1];
      const p0 = mergedPoints[e0.indices[0] + e0.indices[1] - p.index];
      const p1 = mergedPoints[e1.indices[0] + e1.indices[1] - p.index];
      const angle0 = Math.atan2(p0.p.y - p.p.y, p0.p.x - p.p.x);
      const angle1 = Math.atan2(p1.p.y - p.p.y, p1.p.x - p.p.x);
      if (angle0 > angle1) return -1;
      if (angle0 < angle1) return 1;
      return 0;
    });
  }
    
  const islands = [];

  let startIndex = 0;
  // nextIndexはそうだ、逆方向にサーチしないといけないんだっけ。やばい。
  let nextIndex = 0;
  let arrivedIndex;
  // メインループ...
  
  while(1){
    
    if(nextIndex === startIndex) {
      // 次のループの準備
      // 最初にdirtyFlagがfalseであるようなedgeを取るが、
      // このedgeが採用されるとは限らないことに注意する。
      let startEdgeIndex = -1;
      for(let k=0; k<mergedEdges.length; k++){
        const e = mergedEdges[k];
        if (!e.dirtyFlag) {
          startEdgeIndex = e.index;
          break;
        }
      }
      // dirty辺が無くなったら終了
      if (startEdgeIndex < 0){
        break;
      } else {
        const startEdge = mergedEdges[startEdgeIndex];
        startIndex = startEdge.xMinIndex;
        
        for(let i=mergedPoints[startIndex].indices.length-1; i>=0; i--){
          const index = mergedPoints[startIndex].indices[i];
          if(!mergedEdges[index].dirtyFlag){
            arrivedIndex = index;
            nextIndex = mergedEdges[index].indices[0] + mergedEdges[index].indices[1] - startIndex;
            mergedEdges[index].dirtyFlag = true;
            islands.push([startIndex]);
            break;
          }
        }
      }
    }
    
    const p = mergedPoints[nextIndex];
    // p.indicesの元をサーチしていく。
    // 最初にarrivedEdge.indexになるところを特定
    let searchStartIndex;
    for(let i=0; i<p.indices.length; i++){
      if (p.indices[i] === arrivedIndex) {
        searchStartIndex = i; break;
      }
    }
    // ここからはじめて1ずつ足していってdirtyFlagがfalseのがみつかったらそこで切る
    // なかったらサーチが終わる感じ
    // ただし来た辺が多重辺の場合、1つ前も一応調べないとまずい場合があるので、
    // 先に1つ前だけ調べてそこが多重辺の仲間の場合はそれを採用する
    for(let i=0; i<p.indices.length; i++){
      
      const targetIndex = (i===0 ? (searchStartIndex-1+p.indices.length)%p.indices.length : (searchStartIndex+i)%p.indices.length);
      const e = mergedEdges[p.indices[targetIndex]];
      const ae = mergedEdges[arrivedIndex];
      
      if(i===0){
        // 多重辺の仲間でなければスルー
        if (ae.indices[0] + ae.indices[1] !== e.indices[0] + e.indices[1]) {
          continue;
        }
      }
      
      if(!e.dirtyFlag){
        e.dirtyFlag = true;
        islands[islands.length-1].push(nextIndex);
        nextIndex = e.indices[0] + e.indices[1] - nextIndex;
        arrivedIndex = e.index;
        break;
      }
    }
  }

  const tessellation = [];
  const segments = [];
    
  for(const island of islands){
    const segment = [];
    for(let i=0; i<island.length; i++){
      segment.push(mergedPoints[island[i]].p);
    }
    tessellation.push(...simpleEarcut(segment));
    segments.push(segment);
  }
  return {tess:tessellation, seg:segments};
}