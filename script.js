const SIZE = 4;

function array2D(x, y, value) {
    return new Array(x).fill(0).map(() => new Array(y).fill(value));
}

window.addEventListener("load", () => {
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const section = document.querySelector("section");
    let rect = section.getBoundingClientRect();

    let cells = array2D(
        Math.ceil(window.innerWidth / SIZE),
        Math.ceil(window.innerHeight / SIZE),
        false
    );

    // Update and shift tile array on resize
    function onResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        rect = section.getBoundingClientRect();

        const targetWidth = Math.ceil(window.innerWidth / SIZE);
        if (cells.length > targetWidth) {
            cells.splice(2 * targetWidth - cells.length);
        } else if (cells.length < targetWidth) {
            cells.push(...array2D(targetWidth - cells.length, cells[0].length, false));
        }

        const targetHeight = Math.ceil(window.innerHeight / SIZE);
        if (cells[0].length > targetHeight) {
            cells.forEach((col) => {
                col.splice(0, cells[0].length - targetHeight);
            });
        } else if (cells[0].length < targetHeight) {
            cells.forEach((col) => {
                col.unshift(...new Array(targetHeight - cells[0].length).fill(false));
            });
        }
    }

    onResize();
    window.addEventListener("resize", onResize);

    // Draw cell grid
    function draw() {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.fillStyle = "#eee";
        cells.forEach((a, x) => {
            a.forEach((v, y) => {
                if (v)
                    ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
            });
        });

        window.requestAnimationFrame(draw);
    }

    window.requestAnimationFrame(draw);

    // Paint cells on mouse/touch move
    function paint(evt) {
        if (
            rect.left <= evt.clientX && rect.right >= evt.clientX &&
            rect.top <= evt.clientY && rect.bottom >= evt.clientY
        )
            return;

        const x = Math.floor(evt.clientX / SIZE);
        const y = Math.floor(evt.clientY / SIZE);
        cells[x][y] = true;
    }

    window.addEventListener("mousemove", paint);
    window.addEventListener("touchmove", (evt) => paint(evt.touches[0]));

    // Update automata
    function tileInRect(x, y) {
        const dx = (x + 0.5) * SIZE;
        const dy = (y + 0.5) * SIZE;
        return rect.left <= dx && rect.right >= dx && rect.top <= dy && rect.bottom >= dy;
    }

    function full(x, y) {
        return cells[x][y] || tileInRect(x, y);
    }

    setInterval(() => {
        const tmp = array2D(
            cells.length,
            cells[0].length,
            false
        );
        const reverse = Math.random() < 0.5;
        for (let x_ = 0; x_ < cells.length; x_++) {
            let x = reverse ? cells.length - 1 - x_ : x_;

            for (let y = 0; y < cells[0].length; y++) {
                if (cells[x][y] && !tileInRect(x, y)) {
                    if (y < cells[0].length - 1 && !full(x, y + 1) && !tmp[x][y + 1]) {
                        tmp[x][y + 1] = true;
                    } else if (y < cells[0].length && full(x, y + 1)) {
                        const left = x > 0 && !full(x - 1, y + 1) && !tmp[x - 1][y + 1];
                        const right = x < cells.length - 1 && !full(x + 1, y + 1) && !tmp[x + 1][y + 1];

                        if (!left && !right)
                            tmp[x][y] = true;
                        else if (left && (!right || Math.random() < 0.5))
                            tmp[x - 1][y + 1] = true;
                        else
                            tmp[x + 1][y + 1] = true;
                    } else {
                        tmp[x][y] = true;
                    }
                }
            }
        }
        cells = tmp;
    }, 1000 / 60);
});

