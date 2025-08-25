// 获取Canvas元素和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOver = document.getElementById('gameOver');
const finalScore = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');

// 游戏常量
const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 600;
const FPS = 60;
const GRAVITY = 0.5;
const BIRD_JUMP = -10;
const PIPE_SPEED = 5;
const PIPE_GAP = 150;

// 颜色定义
const WHITE = '#FFFFFF';
const BLACK = '#000000';
const GREEN = '#009688';
const LIGHT_GREEN = '#4CAF50';
const YELLOW = '#FFEB3B';
const RED = '#F44336';
const SKY_BLUE = '#87CEEB';
const BROWN = '#795548';
const GRASS_GREEN = '#32CD32';

// 游戏状态
let bird;
let pipes = [];
let score = 0;
let gameRunning = false;
let lastTime = 0;
let animationId;
let backgroundScroll = 0;
let groundScroll = 0;

// 小鸟类
class Bird {
    constructor() {
        this.x = 50;
        this.y = SCREEN_HEIGHT / 2;
        this.velocity = 0;
        this.width = 30;
        this.height = 30;
        this.angle = 0;
        this.wingUp = true;
        this.wingAnimationCounter = 0;
    }

    jump() {
        this.velocity = BIRD_JUMP;
        this.angle = 20;
    }

    update() {
        // 更新位置和速度
        this.velocity += GRAVITY;
        this.y += this.velocity;

        // 更新角度
        if (this.velocity < 0) {
            this.angle = Math.min(20, this.angle + 3);
        } else {
            this.angle = Math.max(-90, this.angle - 6);
        }

        // 边界检查
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        if (this.y > SCREEN_HEIGHT - 50 - this.height) {
            this.y = SCREEN_HEIGHT - 50 - this.height;
            this.velocity = 0;
            this.angle = 0;
        }

        // 翅膀动画
        this.wingAnimationCounter++;
        if (this.wingAnimationCounter % 5 === 0) {
            this.wingUp = !this.wingUp;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate((this.angle * Math.PI) / 180);
        ctx.translate(-this.width / 2, -this.height / 2);

        // 绘制小鸟身体（椭圆）
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        ctx.ellipse(15, 15, 15, 12, 0, 0, 2 * Math.PI);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(25, 10, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(28, 10, 2, 0, 2 * Math.PI);
        ctx.fill();

        // 嘴巴
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.moveTo(30, 10);
        ctx.lineTo(30, 20);
        ctx.lineTo(40, 15);
        ctx.closePath();
        ctx.fill();

        // 羽毛纹理
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15, 5);
        ctx.lineTo(25, 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(10, 10);
        ctx.lineTo(20, 20);
        ctx.stroke();

        // 翅膀
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        if (this.wingUp) {
            ctx.ellipse(0, 15, 10, 5, 0, 0, 2 * Math.PI);
        } else {
            ctx.ellipse(0, 20, 10, 5, 0, 0, 2 * Math.PI);
        }
        ctx.fill();

        ctx.restore();
    }
}

// 管道类
class Pipe {
    constructor(x) {
        this.x = x;
        this.width = 60;
        this.height = Math.floor(Math.random() * 200) + 100;
        this.gapStart = this.height + PIPE_GAP;
        this.passed = false;
    }

    update() {
        this.x -= PIPE_SPEED;
    }

    draw() {
        // 绘制上管道
        ctx.fillStyle = GREEN;
        ctx.fillRect(this.x, 0, this.width, this.height + 20);
        ctx.fillStyle = LIGHT_GREEN;
        ctx.fillRect(this.x + 5, 5, this.width - 10, 10);
        ctx.fillRect(this.x + 5, 25, this.width - 10, this.height - 5);

        // 绘制下管道
        ctx.fillStyle = GREEN;
        ctx.fillRect(this.x, this.gapStart, this.width, SCREEN_HEIGHT - this.gapStart + 20);
        ctx.fillStyle = LIGHT_GREEN;
        ctx.fillRect(this.x + 5, this.gapStart + 5, this.width - 10, SCREEN_HEIGHT - this.gapStart - 5);
        ctx.fillRect(this.x + 5, SCREEN_HEIGHT + 20 - 15, this.width - 10, 10);
    }

    collide(bird) {
        if (bird.x + bird.width > this.x && bird.x < this.x + this.width) {
            if (bird.y < this.height || bird.y + bird.height > this.gapStart) {
                return true;
            }
        }
        return false;
    }
}

// 创建新管道
function createPipe() {
    if (pipes.length === 0 || pipes[pipes.length - 1].x < SCREEN_WIDTH - 200) {
        pipes.push(new Pipe(SCREEN_WIDTH));
    }
}

// 初始化游戏
function initGame() {
    bird = new Bird();
    pipes = [];
    score = 0;
    gameRunning = true;
    backgroundScroll = 0;
    groundScroll = 0;
    gameOver.style.display = 'none';
    lastTime = performance.now();
    startGameLoop();
}

// 游戏主循环
function gameLoop(currentTime) {
    if (!gameRunning) return;

    // 计算时间增量
    const deltaTime = (currentTime - lastTime) / (1000 / FPS);
    lastTime = currentTime;

    // 清空画布
    ctx.fillStyle = SKY_BLUE;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 绘制云朵
    backgroundScroll -= 0.5;
    if (backgroundScroll < -SCREEN_WIDTH) {
        backgroundScroll = 0;
    }
    drawClouds();

    // 更新和绘制小鸟
    bird.update();
    bird.draw();

    // 创建和更新管道
    createPipe();
    updatePipes();

    // 绘制地面
    groundScroll -= 5;
    if (groundScroll < -SCREEN_WIDTH) {
        groundScroll = 0;
    }
    drawGround();

    // 显示分数
    drawScore();

    // 继续游戏循环
    animationId = requestAnimationFrame(gameLoop);
}

// 开始游戏循环
function startGameLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(gameLoop);
}

// 更新管道
function updatePipes() {
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.update();
        pipe.draw();

        // 检查碰撞
        if (pipe.collide(bird)) {
            endGame();
            return;
        }

        // 检查是否通过管道
        if (!pipe.passed && pipe.x + pipe.width < bird.x) {
            pipe.passed = true;
            score++;
        }

        // 移除屏幕外的管道
        if (pipe.x + pipe.width < 0) {
            pipes.splice(i, 1);
        }
    }
}

// 绘制云朵
function drawClouds() {
    ctx.fillStyle = WHITE;
    for (let i = 0; i < 5; i++) {
        const cloudX = (i * 100) + (backgroundScroll % 100);
        ctx.beginPath();
        ctx.ellipse(cloudX, 50 + i * 20, 30, 15, 0, 0, 2 * Math.PI);
        ctx.ellipse(cloudX + 20, 40 + i * 20, 30, 15, 0, 0, 2 * Math.PI);
        ctx.ellipse(cloudX + 40, 50 + i * 20, 30, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// 绘制地面
function drawGround() {
    // 地面
    ctx.fillStyle = BROWN;
    ctx.fillRect(groundScroll, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 50);
    ctx.fillRect(groundScroll + SCREEN_WIDTH, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 50);
    
    // 草地
    ctx.fillStyle = GRASS_GREEN;
    ctx.fillRect(groundScroll, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 10);
    ctx.fillRect(groundScroll + SCREEN_WIDTH, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 10);
}

// 绘制分数
function drawScore() {
    ctx.font = '50px Arial';
    ctx.fillStyle = BLACK;
    ctx.textAlign = 'center';
    ctx.fillText(score.toString(), SCREEN_WIDTH / 2 + 2, 62);
    ctx.fillStyle = WHITE;
    ctx.fillText(score.toString(), SCREEN_WIDTH / 2, 60);
}

// 结束游戏
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    finalScore.textContent = score;
    gameOver.style.display = 'flex';
}

// 处理按键事件
function handleKeyDown(event) {
    if (event.code === 'Space') {
        event.preventDefault();
        if (gameRunning) {
            bird.jump();
        } else {
            initGame();
        }
    }
}

// 处理点击事件
function handleCanvasClick() {
    if (gameRunning) {
        bird.jump();
    }
}

// 绑定事件监听器
window.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('click', handleCanvasClick);
restartButton.addEventListener('click', initGame);

// 初始化游戏
initGame();