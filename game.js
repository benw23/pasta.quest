class Point {
    constructor(x, y) {
        this.x = Number(x);
        this.y = Number(y);
    }

    get_coords() {
        return [this.x,this.y];
    }

    clone() {
        return new Point(this.x, this.y);
    }

    distance(p2) {
        if(p2.get_coords) {
            let [x2, y2] = p2.get_coords();

            let dx = this.x-x2;
            let dy = this.y-y2;

            return Math.sqrt(dx*dx+dy*dy);
        } else {
            return p2.distance(this);
        }
    }

    is_horizontal(p2) {
        if(p2.get_coords) {
            let [x2, y2] = p2.get_coords();

            return this.x == x2;
        } else {
            return p2.is_horizontal(this);
        }
    }

    is_vertical(p2) {
        if(p2.get_coords) {
            let [x2, y2] = p2.get_coords();

            return this.y == y2;
        } else {
            return p2.is_vertical(this);
        }
    }
}

class Game {
    constructor(ctx) {
        this.ctx = ctx;
        this.width = 24;
        this.height = 24;

        this.grid_size = 40;

        this.state = "running";
        this.speed = 250;
        this.lastTick = Date.now();
        this.score = 0;
        this.direction = 0;
        this.sauces = [];
        this.tail = new Point(12, 12);
        this.head = new Point(13, 12);
        this.noodle = [0]; // this is inefficient but the noodle will be short so it's fine
        this.length = 10;
    }

    add_sauce() {
        let p = new Point(Math.floor(Math.random()*24), Math.floor(Math.random()*24));
        if(this.sauces.find((x) => p.distance(x) < 2)) {
            this.add_sauce();
        } else {
            this.sauces.push(p);
        }
        this.check_intersection();
    }

    check_intersection() {
        let num_sauces = this.sauces.length;
        let p = this.tail.clone();

        for (let i = 0; i < this.noodle.length; i++) {
            let [x, y] = p.get_coords();
            this.sauces = this.sauces.filter((s) => s.distance(p) > 0.1);
            this.move(p, this.noodle[i])
        };

        for(let i = 0; i < num_sauces - this.sauces.length; i++) {
            this.length += 1;
            this.speed*=0.95;
            this.speed+=2;
            this.add_sauce();
        };
    }

    render_board() {
        ctx.fillStyle = "#1f1f1f";
        ctx.fillRect(0, 0, (this.width+1)*this.grid_size, (this.height+1)*this.grid_size);
    }

    render_sauce() {
        ctx.fillStyle = "#fff";
        ctx.font = this.grid_size.toString() + "px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        this.sauces.forEach((sauce) => {
            let [x,y] = sauce.get_coords();
            ctx.fillText("🍝", (x+0.5)*this.grid_size, (y+0.5)*this.grid_size);
        });
    }

    render_pasta() {
        ctx.strokeStyle = "#d69f30";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = this.grid_size/5;

        let p = this.tail.clone();

        ctx.beginPath();

        for (let i = 0; i < this.noodle.length; i++) {
            let [x, y] = p.get_coords();

            ctx.moveTo((x+0.5)*this.grid_size, (y+0.5)*this.grid_size);
            if(this.move(p, this.noodle[i])) {
                this.move(p, (this.noodle[i]+2)%4);
                this.move_no_wrap(p, this.noodle[i]);
                [x, y] = p.get_coords();
                ctx.lineTo((x+0.5)*this.grid_size, (y+0.5)*this.grid_size);
                this.move_no_wrap(p, (this.noodle[i]+2)%4);
                this.move(p, this.noodle[i]);
                this.move_no_wrap(p, (this.noodle[i]+2)%4);
                [x, y] = p.get_coords();
                ctx.moveTo((x+0.5)*this.grid_size, (y+0.5)*this.grid_size);
                this.move_no_wrap(p, this.noodle[i]);
                [x, y] = p.get_coords();
                ctx.lineTo((x+0.5)*this.grid_size, (y+0.5)*this.grid_size);
            } else {
                [x, y] = p.get_coords();
                ctx.lineTo((x+0.5)*this.grid_size, (y+0.5)*this.grid_size);
            }
        };

        ctx.stroke();
    }

    render() {
        this.render_board();
        this.render_sauce();
        this.render_pasta();
    }

    move_no_wrap(p, d) {
        switch (d) {
            case 0:
                p.x+=1;
                break;
            case 1:
                p.y+=1;
                break;
            case 2:
                p.x-=1;
                break;
            case 3:
                p.y-=1;
                break;
        }
    }

    move(p, d) {
        let wrapped = false;
        switch (d) {
            case 0:
                p.x+=1;
                break;
            case 1:
                p.y+=1;
                break;
            case 2:
                p.x-=1;
                break;
            case 3:
                p.y-=1;
                break;
        }
        
        if((p.x+this.width+1) % (this.width+1) != p.x) wrapped = true;
        if((p.y+this.height+1) % (this.height+1) != p.y) wrapped = true;
        
        p.x = (p.x+this.width+1) % (this.width+1);
        p.y = (p.y+this.height+1) % (this.height+1);

        return wrapped;
    }

    update() {
        let dt = Date.now()-this.lastTick;

        for(let i = 0; i < Math.floor(dt/this.speed); i++) {
            this.update_noodle();
            this.lastTick = Date.now();
        }

        if(dt/this.speed >= 1) {
            this.render();
        }
    }

    update_noodle() {
        this.noodle.push(this.direction);
        this.move(this.head, this.direction);

        if(this.noodle.length > this.length) {
            this.move(this.tail, this.noodle.shift());
        }

        let num_sauces = this.sauces.length;
        this.sauces = this.sauces.filter((s) => s.distance(this.head) > 0.1);

        if(this.sauces.length < num_sauces) {
            this.length += 1;
            this.speed*=0.95;
            this.speed+=2;
            this.add_sauce();
        }
    }

    tick() {
        this.update();
        //this.render();
        window.requestAnimationFrame(()=>this.tick())
    }

    start() {
        window.addEventListener("keydown", e => {
            switch (e.code) {
                case "KeyW":
                case "ArrowUp":
                    this.direction = 3;
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.direction = 0;
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.direction = 1;
                    break;
                case "KeyA":
                case "ArrowLeft":
                    this.direction = 2;
                    break;
            };
        });
        window.requestAnimationFrame(()=>this.tick());
    }
}

const ctx = document.getElementById("game").getContext("2d");
const game = new Game();

for(let i = 0; i < 3; i++) {
    game.add_sauce();
}

game.start();