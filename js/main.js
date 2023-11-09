function Ship (_length, _axis, id){
    const length = _length;
    let axis = _axis; // [0, 1] => going right, [0, -1] => going left, [1, 0] => going down [-1, 0] => going up
    let hits = 0;

    const hit = ()=>{hits++;};
    const isSunk = ()=>{return length === hits;}
    const getLength = ()=>{return length;}
    const getAxis = ()=>{return axis;}
    const rotateAxis = ()=>{
        const tmp = axis[0];
        axis[0] = axis[1];
        axis[1] = -1*tmp;
    }
    const getHit = ()=>{return hits;}
    return {id, hit, isSunk, getLength, getAxis, rotateAxis, getHit};
}

function GameBoard (n,m){
    const rows = n;
    const cols = m;
    let board = new Array(n).fill().map(()=>new Array(m).fill(0));

    function inBounds(coord){
        return 0 <= coord[0] && coord[0] < rows && 0 <= coord[1] && coord[1] < cols;
    }

    const placeShip = (startCoord, ship)=>{
        const shipLength = ship.getLength();
        const shipAxis = ship.getAxis();
        const endCoord = [startCoord[0] + shipLength * shipAxis[0], startCoord[1] + shipLength * shipAxis[1]];

        if(!inBounds(startCoord) || !inBounds(endCoord)){
            console.log("Not In Bounds");
            console.log("Handle case");
            return false;
        }

        for(let i = 0; i < shipLength; i++){
            // reverse ship placement if it overlaps with another ship;
            if(board[startCoord[0] + i*shipAxis[0]][startCoord[1] + i*shipAxis[1]] != 0){
                i--;
                while(i >= 0){
                    board[startCoord[0] + i*shipAxis[0]][startCoord[1] + i*shipAxis[1]] = 0;
                    i--;
                }
                return false;
            }
            board[startCoord[0] + i*shipAxis[0]][startCoord[1] + i*shipAxis[1]] = ship;
        }

        console.log(board);
        return true;
    };

    const recieveAttack = (coords)=>{
        let ret;
        if (board[coords[0]][coords[1]] === 0){
            board[coords[0]][coords[1]] = -1;
            ret = 0;
        }
        else if (board[coords[0]][coords[1]] === -1){
            ret = -1;
        }
        else{
            board[coords[0]][coords[1]].hit();
            board[coords[0]][coords[1]] = 1;
            ret = 1;
        }

        console.log(board);
        return ret;
    }
    
 
    return {placeShip, recieveAttack};
}

function Player (_name,_turn){
    const turn = _turn;
    const name = _name;

    const getTurn = () =>{return turn};
    const myTurn = () =>{turn = true};
    const finishTurn = () =>{turn = false};

    const getName = ()=>{return name};

    return {getTurn, myTurn, finishTurn, getName};
}

const domManager = (()=>{
    function initializeBoard(n,m){
        const content = document.querySelectorAll('.content');

        content.forEach((content)=>{
            const board = document.createElement('div')
            board.classList.add('board');
            board.style.display = 'grid';
            board.style.height = '100%';
            board.style.gridTemplateRows = `repeat(${n}, 1fr)`;
            board.style.gridTemplateColumns = `repeat(${m}, 1fr)`;

            for(let i = 0; i < n*m; i++){
                    const grid = document.createElement('div');
                    grid.classList.add('grid');
                    grid.dataset.row = Math.floor(i/n);
                    grid.dataset.col = i % m;
                board.appendChild(grid);
            }
            content.appendChild(board);
        }); 
    }

    function addShipMoveEventListener(player, gameboard){
        const ships = document.querySelectorAll(`#${player.getName()}-div .grid.show`);
        console.log(ships);
        ships.forEach(ship=>{
            console.log(ship);
            ship.addEventListener('mouseover', ()=>{
                const shipGroup = document.querySelectorAll(`#${player.getName()}-div .grid[data-ship_id="${ship.dataset.ship_id}"]`);
                console.log(shipGroup);
                shipGroup.forEach(s=>{
                    s.style.outline = '2px solid cyan';
                });
            });
            ship.addEventListener('mouseout', ()=>{
                const shipGroup = document.querySelectorAll(`#${player.getName()}-div .grid[data-ship_id="${ship.dataset.ship_id}"]`);
                console.log(shipGroup);
                shipGroup.forEach(s=>{
                    s.style.outline = 'none';
                });
            });
            ship.addEventListener('click', ()=>{
                const shipGroup = document.querySelectorAll(`#${player.getName()}-div .grid[data-ship_id="${ship.dataset.ship_id}"]`);
                shipGroup.forEach(s=>{
                    s.removeAttribute('data-ship_id');
                    // s.classList.toggle('not-hit');
                    s.classList.toggle('moving');
                    s.style.outline = 'none';
                });
            });
        });


    }

    function addGridAttackEventListener(player, gameboard){
        const grids = document.querySelectorAll(`#${player.getName()}-div .grid`);
        grids.forEach(grid =>{
            grid.addEventListener('click', ()=>{
                const coords = [grid.dataset.row, grid.dataset.col];
                const ret = gameboard.recieveAttack(coords);
                if (ret == -1){
                    return;
                }
                else if(ret == 1){
                    grid.classList.add('hit');
                }
                else{
                    grid.classList.add('miss');
                }
            });
        });
    }

    function hideShips(){
        const grids = document.querySelectorAll(`.grid.show`);

        grids.forEach(grid=>{
            grid.classList.toggle('show');
        });
    }

    function placeShip(player, startCoord, ship){
        const shipLength = ship.getLength();
        const shipAxis = ship.getAxis();

        for(let i = 0; i < shipLength; i++){
            const row = startCoord[0] + i*shipAxis[0];
            const col = startCoord[1] + i*shipAxis[1];
            const grid = document.querySelector(`#${player.getName()}-div .grid[data-row="${row}"][data-col="${col}"]`);
            // grid.dataset.ship_id = ship.id;
            grid.classList.add('show');
        }

        return true;
    }

    return {initializeBoard, addGridAttackEventListener, placeShip, addShipMoveEventListener, hideShips};
})();



const gameManager = ((n,m)=>{
    const p1 = Player('p1',true);
    const p2 = Player('p2',false);

    const g1 = GameBoard(n,m);
    const g2 = GameBoard(n,m);

    domManager.initializeBoard(n,m);



    // create Ships
    let p1Ships = [];
    let p2Ships = [];

    for(let i = 2, id = 0; i <= 5; i++, id++){
        if(i === 3){
            p1Ships.push(Ship(i, [1,0], id));
            p2Ships.push(Ship(i, [1,0], id));
            id++;
        }
        p1Ships.push(Ship(i, [1,0], id));
        p2Ships.push(Ship(i, [1,0], id));
    }

    // Place Ships Randomly
    const randomizeShip = (ship, player, gboard) =>{
        const coords = [Math.floor(Math.random() * n), Math.floor(Math.random()*m)];
        const rotate = Math.floor(Math.random() * 5);
        ship.rotateAxis(rotate);
        if(gboard.placeShip(coords, ship)){
            domManager.placeShip(player, coords, ship)
            return true;
        }
        return false;
    }
    for (let i = 0; i < p1Ships.length; i++){
        while(!randomizeShip(p1Ships[i], p1, g1));
        while(!randomizeShip(p2Ships[i], p2, g2));
    }

    // Placing Phase
    // domManager.addShipMoveEventListener(p1, g1);
    // domManager.addShipMoveEventListener(p2, g2);

    // Hide Phase
    // domManager.hideShips();

    // Game Phase
    domManager.addGridAttackEventListener(p1, g1);
    domManager.addGridAttackEventListener(p2, g2);
})(10,10);



// const g1 = GameBoard(8,8);
// const s1 = Ship(5, [0,1]);

// do{
//     console.log(s1.getAxis());
//     s1.rotateAxis();
// }while(s1.getAxis()[0] != 0 || s1.getAxis()[1] != 1);

// g1.placeShip([0,0], s1);
// g1.recieveAttack([0,0]);
// g1.recieveAttack([0,1]);
// g1.recieveAttack([0,2]);
// g1.recieveAttack([0,3]);
// g1.recieveAttack([0,4]);
// console.log(s1.isSunk());

// console.log(g1.recieveAttack([1,3]))

/*
TODO:
    - Allow user to move ships
    - Implement Game Phase
*/