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
const GRAVITY = 0.35;
const BIRD_JUMP = -7; // 减小跳跃幅度，使在手机上更容易控制
const INITIAL_PIPE_SPEED = 3; // 初始管道速度
const MIN_PIPE_SPEED = 8; // 最大管道速度
const INITIAL_PIPE_GAP = 180; // 初始管道间隙
const MIN_PIPE_GAP = 140; // 最小管道间隙

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
let missiles = [];
let score = 0;
let gameRunning = false;
let lastTime = 0;
let animationId;
let backgroundScroll = 0;
let groundScroll = 0;
let pipeSpeed = INITIAL_PIPE_SPEED;
let pipeGap = INITIAL_PIPE_GAP;
let missileCount = 0;
let missileActive = false;
let missileCooldown = 0;
let missileButton; // 导弹按钮元素

// 小鸟类
class Bird {
    constructor() {
        this.x = 50;
        this.y = SCREEN_HEIGHT / 2;
        this.velocity = 0;
        this.width = 40;
        this.height = 30;
        this.wingUp = true;
        this.wingAnimationCounter = 0;
        this.isJumping = false;
        this.trailParticles = [];
    }

    jump() {
        this.velocity = BIRD_JUMP;
        this.isJumping = true;
        // 添加跳跃粒子效果
        this.addTrailParticle();
    }

    update() {
        // 更新位置和速度
        this.velocity += GRAVITY;
        this.y += this.velocity;
        
        this.isJumping = this.velocity < 0;
        
        // 更新尾迹粒子
        this.updateTrailParticles();

        // 边界检查
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }
        if (this.y > SCREEN_HEIGHT - 50 - this.height) {
            this.y = SCREEN_HEIGHT - 50 - this.height;
            this.velocity = 0;
        }

        // 翅膀动画
        this.wingAnimationCounter++;
        if (this.wingAnimationCounter % 5 === 0) {
            this.wingUp = !this.wingUp;
        }
    }

    draw() {
        // 先绘制尾迹粒子
        this.drawTrailParticles();

        // 无需旋转，保持水平姿态
        ctx.save();
        
        // 绘制小鸟身体阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x + 22, this.y + 17, 20, 14, 0, 0, 2 * Math.PI);
        ctx.fill();

        // 绘制小鸟身体（椭圆）
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 15, 20, 12, 0, 0, 2 * Math.PI);
        ctx.fill();

        // 身体纹理
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + 12, 8, 6, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 8, 6, 4, 0, 0, 2 * Math.PI);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 10, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = BLACK;
        ctx.beginPath();
        ctx.arc(this.x + 33, this.y + 10, 2, 0, 2 * Math.PI);
        ctx.fill();
        // 眼睛高光
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(this.x + 31, this.y + 9, 1, 0, 2 * Math.PI);
        ctx.fill();

        // 嘴巴
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.moveTo(this.x + 35, this.y + 10);
        ctx.lineTo(this.x + 35, this.y + 20);
        ctx.lineTo(this.x + 45, this.y + 15);
        ctx.closePath();
        ctx.fill();

        // 翅膀动画
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        if (this.wingUp) {
            // 翅膀向上
            ctx.ellipse(this.x - 5, this.y + 15, 15, 7, 0, 0, 2 * Math.PI);
        } else {
            // 翅膀向下
            ctx.ellipse(this.x - 5, this.y + 20, 15, 7, 0, 0, 2 * Math.PI);
        }
        ctx.fill();

        // 腮红
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x + 28, this.y + 15, 3, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    }
    
    // 添加尾迹粒子
    addTrailParticle() {
        for (let i = 0; i < 3; i++) {
            this.trailParticles.push({
                x: this.x,
                y: this.y + this.height / 2,
                size: Math.random() * 4 + 2,
                speed: Math.random() * 3 + 1,
                life: 10 + Math.random() * 10,
                color: '#FFD700'
            });
        }
    }
    
    // 更新尾迹粒子
    updateTrailParticles() {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            particle.x -= particle.speed;
            particle.life--;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }
    
    // 绘制尾迹粒子
    drawTrailParticles() {
        for (const particle of this.trailParticles) {
            ctx.fillStyle = particle.color;
            ctx.globalAlpha = particle.life / 20;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
}

// 导弹类
class Missile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 15;
        this.height = 8;
        this.speed = 15;
        this.exploding = false;
        this.explosionSize = 0;
    }

    update() {
        if (this.exploding) {
            this.explosionSize += 3;
            if (this.explosionSize > 30) {
                return false;
            }
        } else {
            this.x += this.speed;
            // 检查是否超出屏幕
            if (this.x > SCREEN_WIDTH) {
                return false;
            }
        }
        return true;
    }

    draw() {
        if (this.exploding) {
            // 绘制爆炸效果
            ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionSize, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explosionSize * 0.6, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // 绘制导弹
            ctx.fillStyle = '#666666';
            ctx.fillRect(this.x, this.y - this.height / 2, this.width, this.height);
            
            // 导弹头
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width, this.y - this.height / 2);
            ctx.lineTo(this.x + this.width + 5, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height / 2);
            ctx.closePath();
            ctx.fill();
            
            // 导弹尾焰
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.moveTo(this.x - 3, this.y - this.height / 2 + 1);
            ctx.lineTo(this.x - 8, this.y);
            ctx.lineTo(this.x - 3, this.y + this.height / 2 - 1);
            ctx.closePath();
            ctx.fill();
        }
    }

    // 检查是否击中管道
    checkHit(pipe) {
        if (!this.exploding && pipe.x < this.x + this.width && pipe.x + pipe.width > this.x) {
            // 检查上管道
            if (pipe.y === 0 && this.y < pipe.height + 20) {
                this.exploding = true;
                pipe.damage = true;
                return true;
            }
            // 检查下管道
            if (pipe.y !== 0 && this.y > pipe.gapStart) {
                this.exploding = true;
                pipe.damage = true;
                return true;
            }
        }
        return false;
    }
}

// 管道类
class Pipe {
    constructor(x) {
        this.x = x;
        this.width = 70;
        this.height = Math.floor(Math.random() * 180) + 120;
        this.gapStart = this.height + pipeGap;
        this.passed = false;
        this.textureOffset = Math.random() * 100; // 随机纹理偏移
        this.damage = false; // 是否被导弹击中
        this.damageTimer = 0;
    }

    update() {
        this.x -= pipeSpeed;
        
        // 更新损伤效果
        if (this.damage) {
            this.damageTimer++;
            if (this.damageTimer > 15) {
                this.damage = false;
                this.damageTimer = 0;
            }
        }
    }

    draw() {
        // 绘制阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(this.x + 3, 0, this.width - 3, this.height + 20);
        ctx.fillRect(this.x + 3, this.gapStart, this.width - 3, SCREEN_HEIGHT - this.gapStart + 20);

        // 上管道主体
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(this.x, 0, this.width, this.height + 20);
        
        // 上管道顶部装饰
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(this.x - 5, 5, this.width + 10, 20);
        
        // 上管道纹理
        ctx.fillStyle = '#1B5E20';
        for (let i = 0; i < this.height / 20; i++) {
            const y = 30 + i * 20 + this.textureOffset;
            if (y < this.height) {
                ctx.fillRect(this.x + 5, y, this.width - 10, 2);
            }
        }

        // 下管道主体
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(this.x, this.gapStart, this.width, SCREEN_HEIGHT - this.gapStart + 20);
        
        // 下管道底部装饰
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(this.x - 5, SCREEN_HEIGHT + 20 - 25, this.width + 10, 20);
        
        // 下管道纹理
        ctx.fillStyle = '#1B5E20';
        for (let i = 0; i < (SCREEN_HEIGHT - this.gapStart) / 20; i++) {
            const y = this.gapStart + 5 + i * 20 + this.textureOffset;
            if (y < SCREEN_HEIGHT + 20) {
                ctx.fillRect(this.x + 5, y, this.width - 10, 2);
            }
        }
        
        // 绘制损伤效果
        if (this.damage) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.height / 2, 20, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.gapStart + (SCREEN_HEIGHT - this.gapStart) / 2, 20, 0, 2 * Math.PI);
            ctx.fill();
        }
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
    if (pipes.length === 0 || pipes[pipes.length - 1].x < SCREEN_WIDTH - (pipeGap + 20)) {
        pipes.push(new Pipe(SCREEN_WIDTH));
    }
}

// 初始化游戏
function initGame() {
    bird = new Bird();
    pipes = [];
    missiles = [];
    score = 0;
    missileCount = 0;
    missileActive = false;
    missileCooldown = 0;
    pipeSpeed = INITIAL_PIPE_SPEED;
    pipeGap = INITIAL_PIPE_GAP;
    gameRunning = true;
    backgroundScroll = 0;
    groundScroll = 0;
    gameOver.style.display = 'none';
    
    // 获取导弹按钮元素
    if (!missileButton) {
        missileButton = document.getElementById('missileButton');
        missileButton.addEventListener('click', handleMissileButtonClick);
    }
    
    updateMissileButtonVisibility();
    
    lastTime = performance.now();
    startGameLoop();
}

// 开始游戏循环
function startGameLoop() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animationId = requestAnimationFrame(gameLoop);
}

// 游戏主循环
function gameLoop(currentTime) {
    if (!gameRunning) return;

    // 计算时间增量
    const deltaTime = (currentTime - lastTime) / (1000 / FPS);
    lastTime = currentTime;

    // 绘制渐变天空背景
    const gradient = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    gradient.addColorStop(0, '#87CEEB'); // 浅蓝色（天空顶部）
    gradient.addColorStop(1, '#E0F7FA'); // 很浅的蓝色（天空底部）
    ctx.fillStyle = gradient;
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

    // 更新和绘制导弹
    updateMissiles();
    
    // 绘制地面
    groundScroll -= 5;
    if (groundScroll < -SCREEN_WIDTH) {
        groundScroll = 0;
    }
    drawGround();

    // 显示分数
    drawScore();
    
    // 显示导弹数量
    drawMissileCount();
    
    // 难度递增
    updateDifficulty();
    
    // 导弹冷却
    if (missileCooldown > 0) {
        missileCooldown--;
    }
    
    // 更新导弹按钮可见性
    updateMissileButtonVisibility();

    // 继续游戏循环
    animationId = requestAnimationFrame(gameLoop);
}

// 更新导弹
function updateMissiles() {
    for (let i = missiles.length - 1; i >= 0; i--) {
        const missile = missiles[i];
        if (!missile.update()) {
            missiles.splice(i, 1);
        } else {
            missile.draw();
            // 检查导弹是否击中管道
            for (const pipe of pipes) {
                if (missile.checkHit(pipe)) {
                    break;
                }
            }
        }
    }
}

// 显示导弹数量
function drawMissileCount() {
    ctx.font = '20px Arial';
    ctx.fillStyle = BLACK;
    ctx.textAlign = 'left';
    ctx.fillText(`导弹: ${missileCount}`, 10 + 2, 32);
    ctx.fillStyle = WHITE;
    ctx.fillText(`导弹: ${missileCount}`, 10, 30);
    
    // 绘制导弹图标
    if (missileCount > 0) {
        ctx.fillStyle = '#666666';
        ctx.fillRect(80, 20, 15, 8);
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.moveTo(95, 20);
        ctx.lineTo(100, 24);
        ctx.lineTo(95, 28);
        ctx.closePath();
        ctx.fill();
    }
}

// 更新难度
function updateDifficulty() {
    // 随着分数增加，管道速度增加
    if (score > 0 && score % 5 === 0) {
        pipeSpeed = Math.min(MIN_PIPE_SPEED, INITIAL_PIPE_SPEED + (score / 10));
        // 管道间隙减小
        pipeGap = Math.max(MIN_PIPE_GAP, INITIAL_PIPE_GAP - (score / 2));
    }
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
            
            // 每3分奖励一枚导弹
            if (score % 3 === 0) {
                missileCount++;
                missileActive = true;
            }
        }

        // 移除屏幕外的管道
        if (pipe.x + pipe.width < 0) {
            pipes.splice(i, 1);
        }
    }
}

// 绘制云朵
function drawClouds() {
    // 远景云（较小、较慢）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let i = 0; i < 3; i++) {
        const cloudX = (i * 150) + (backgroundScroll * 0.3 % 150);
        const cloudY = 70 + (i * 30);
        ctx.beginPath();
        ctx.ellipse(cloudX, cloudY, 40, 20, 0, 0, 2 * Math.PI);
        ctx.ellipse(cloudX + 30, cloudY - 10, 40, 20, 0, 0, 2 * Math.PI);
        ctx.ellipse(cloudX + 60, cloudY, 40, 20, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // 近景云（较大、较快）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 2; i++) {
        const cloudX = (i * 200) + (backgroundScroll * 0.7 % 200);
        const cloudY = 150 + (i * 40);
        ctx.beginPath();
        ctx.ellipse(cloudX, cloudY, 60, 30, 0, 0, 2 * Math.PI);
        ctx.ellipse(cloudX + 40, cloudY - 15, 60, 30, 0, 0, 2 * Math.PI);
        ctx.ellipse(cloudX + 80, cloudY, 60, 30, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// 绘制地面
function drawGround() {
    // 地面阴影
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(groundScroll, SCREEN_HEIGHT - 45, SCREEN_WIDTH, 45);
    ctx.fillRect(groundScroll + SCREEN_WIDTH, SCREEN_HEIGHT - 45, SCREEN_WIDTH, 45);
    
    // 地面主体
    ctx.fillStyle = BROWN;
    ctx.fillRect(groundScroll, SCREEN_HEIGHT - 40, SCREEN_WIDTH, 40);
    ctx.fillRect(groundScroll + SCREEN_WIDTH, SCREEN_HEIGHT - 40, SCREEN_WIDTH, 40);
    
    // 草地
    ctx.fillStyle = GRASS_GREEN;
    ctx.fillRect(groundScroll, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 10);
    ctx.fillRect(groundScroll + SCREEN_WIDTH, SCREEN_HEIGHT - 50, SCREEN_WIDTH, 10);
    
    // 草丛装饰
    ctx.fillStyle = '#2E7D32';
    for (let i = 0; i < 15; i++) {
        const x = (groundScroll % 50) + (i * 30);
        const height = 10 + Math.random() * 15;
        ctx.beginPath();
        ctx.moveTo(x, SCREEN_HEIGHT - 40);
        ctx.lineTo(x - 5, SCREEN_HEIGHT - 40 - height);
        ctx.lineTo(x + 5, SCREEN_HEIGHT - 40 - height);
        ctx.closePath();
        ctx.fill();
    }
    
    // 另一侧的草丛
    for (let i = 0; i < 15; i++) {
        const x = (groundScroll % 50) + SCREEN_WIDTH + (i * 30);
        const height = 10 + Math.random() * 15;
        ctx.beginPath();
        ctx.moveTo(x, SCREEN_HEIGHT - 40);
        ctx.lineTo(x - 5, SCREEN_HEIGHT - 40 - height);
        ctx.lineTo(x + 5, SCREEN_HEIGHT - 40 - height);
        ctx.closePath();
        ctx.fill();
    }
    
    // 石头装饰
    for (let i = 0; i < 3; i++) {
        const x = (groundScroll % 100) + (i * 120);
        const size = 5 + Math.random() * 5;
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(x, SCREEN_HEIGHT - 25, size, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    for (let i = 0; i < 3; i++) {
        const x = (groundScroll % 100) + SCREEN_WIDTH + (i * 120);
        const size = 5 + Math.random() * 5;
        ctx.fillStyle = '#616161';
        ctx.beginPath();
        ctx.arc(x, SCREEN_HEIGHT - 25, size, 0, 2 * Math.PI);
        ctx.fill();
    }
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
    // 游戏结束时隐藏导弹按钮
    if (missileButton) {
        missileButton.classList.remove('visible');
    }
}

// 处理导弹按钮点击
function handleMissileButtonClick() {
    if (gameRunning && missileCount > 0 && missileCooldown === 0) {
        // 发射导弹
        missiles.push(new Missile(bird.x + bird.width, bird.y + bird.height / 2));
        missileCount--;
        missileCooldown = 20; // 冷却时间
        updateMissileButtonVisibility();
    }
}

// 更新导弹按钮可见性
function updateMissileButtonVisibility() {
    if (missileButton) {
        if (gameRunning && missileCount > 0 && missileCooldown === 0) {
            missileButton.classList.add('visible');
        } else {
            missileButton.classList.remove('visible');
        }
    }
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
        // 检查是否可以发射导弹
        if (missileCount > 0 && missileCooldown === 0) {
            // 发射导弹
            missiles.push(new Missile(bird.x + bird.width, bird.y + bird.height / 2));
            missileCount--;
            missileCooldown = 20; // 冷却时间
        } else {
            // 跳跃
            bird.jump();
        }
    }
}

// 绑定事件监听器
window.addEventListener('keydown', handleKeyDown);
canvas.addEventListener('click', handleCanvasClick);
restartButton.addEventListener('click', initGame);

// 初始化游戏
initGame();
