function Ship (_length, _axis, id){
    const length = _length;
    let axis = _axis; // [0, 1] => going right, [0, -1] => going left, [1, 0] => going down [-1, 0] => going up
    let hits = 0;

    const hit = ()=>{hits++;};
    const isSunk = ()=>{return length === hits;}
    const getLength = ()=>{return length;}
    const getAxis = ()=>{return axis;}
    const rotateAxis = (rotate)=>{
        for (let i = 0; i < rotate; i++){
            const tmp = axis[0];
            axis[0] = axis[1];
            axis[1] = -1*tmp;
        }
    }
    const getHit = ()=>{return hits;}
    return {id, hit, isSunk, getLength, getAxis, rotateAxis, getHit};
}

function GameBoard (n,m){
    const rows = n;
    const cols = m;
    let shipCount = 5;
    let board = new Array(n).fill().map(()=>new Array(m).fill(0));

    function inBounds(coord){
        return 0 <= coord[0] && coord[0] < rows && 0 <= coord[1] && coord[1] < cols;
    }

    const placeShip = (startCoord, ship)=>{
        const shipLength = ship.getLength();
        const shipAxis = ship.getAxis();
        const endCoord = [startCoord[0] + (shipLength-1) * shipAxis[0], startCoord[1] + (shipLength-1) * shipAxis[1]];

        if(!inBounds(startCoord) || !inBounds(endCoord)){
            // console.log("Not In Bounds");
            // console.log("Handle case");
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

        // console.log(board);
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
        else if (board[coords[0]][coords[1]] === 1){
            ret = 1;
        }
        else {
            board[coords[0]][coords[1]].hit();
            ret = board[coords[0]][coords[1]];
            board[coords[0]][coords[1]] = 1;
        }

        // console.log(board);
        return ret;
    }
    
    const getShip = (row, col) => {
        console.log(board);
        if (typeof(board[row][col]) != 'object') return undefined;
        return board[row][col]
    };
 
    const resetGrid = (row,col)=>{board[row][col] = 0};

    const shipSunk = () =>{shipCount--;}
    const getShipCount = () =>{return shipCount};

    return {board, placeShip, recieveAttack, getShip, resetGrid, getShipCount, shipSunk};
}

function Player (_name,_turn){
    let turn = _turn;
    const name = _name;

    const getTurn = () =>{return turn};
    const myTurn = () =>{turn = true};
    const finishTurn = () =>{turn = false};

    const getName = ()=>{return name};

    return {getTurn, myTurn, finishTurn, getName};
}

const domManager = (()=>{
    let rows;
    let cols;

    function initializeBoard(n,m){
        rows = n;
        cols = m;
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

    function inBounds(coord){
        return 0 <= coord[0] && coord[0] < rows && 0 <= coord[1] && coord[1] < cols;
    }

    function addShipMoveEventListener(player, gameboard){
        const ships = document.querySelectorAll(`#${player.getName()}-div .grid.show`);
        let selected = false;

        ships.forEach(ship=>{
            function selectShipMouseOver(e){
                if (selected) return;
                const shipGroup = document.querySelectorAll(`#${player.getName()}-div .grid[data-ship_id="${e.target.dataset.ship_id}"]`);
                shipGroup.forEach(s=>{
                    s.classList.add('outline');
                });
            }

            function selectShipMouseOut(e){
                if (selected) return;
                const shipGroup = document.querySelectorAll(`#${player.getName()}-div .grid[data-ship_id="${e.target.dataset.ship_id}"]`);
                shipGroup.forEach(s=>{
                    s.classList.remove('outline');
                });
            }

            function selectShipMouseClick(e){
                if (selected) return;
                const shipGroup = document.querySelectorAll(`#${player.getName()}-div .grid[data-ship_id="${e.target.dataset.ship_id}"]`);
                const grids = document.querySelectorAll(`#${player.getName()}-div .grid`);
                grids.forEach(grid=>{
                    if(grid.dataset.ship_id != undefined) return;
                    const newGrid = grid.cloneNode(true);
                    grid.parentNode.replaceChild(newGrid, grid);
                    newGrid.addEventListener('mouseover', moveMouseOver);
                    newGrid.addEventListener('mouseout', moveMouseOut);
                    newGrid.addEventListener('click', moveMouseClick);
                });

                let shipObj = gameboard.getShip(shipGroup[0].dataset.row, shipGroup[0].dataset.col);
                const shipAxis = shipObj.getAxis();
                const shipLength = shipObj.getLength();
                selected = true;
                shipGroup.forEach(s=>{
                    gameboard.resetGrid(+s.dataset.row, +s.dataset.col);
                    s.removeAttribute('data-ship_id');
                    s.classList.add('moving');
                    s.classList.remove('outline');
                });

                function moveMouseOver(e){
                    if (!selected) return;
                    const grid = e.target;
                    const gridCoord = [+grid.dataset.row, +grid.dataset.col];
                    if (!inBounds(gridCoord) || 
                    !inBounds([gridCoord[0] + (shipLength-1)*shipAxis[0], gridCoord[1] + (shipLength-1)* shipAxis[1]])){
                        console.log("OUT OF BOUNDS");
                        return;
                    } 

                    for(let i = 0; i < shipLength; i++){
                        const row = gridCoord[0] + i*shipAxis[0];
                        const col = gridCoord[1] + i*shipAxis[1];
                        const g = document.querySelector(`#${player.getName()}-div .grid[data-row="${row}"][data-col="${col}"]`);
                        if(g.dataset.ship_id) g.classList.add('invalid-outline');
                        g.classList.add('outline');
                    }
                }
                function moveMouseOut(e){
                    if (!selected) return;
                    const grid = e.target;
                    const gridCoord = [+grid.dataset.row, +grid.dataset.col];

                    if (!inBounds(gridCoord) || 
                    !inBounds([gridCoord[0] + (shipLength-1)*shipAxis[0], gridCoord[1] + (shipLength-1)* shipAxis[1]])){
                        console.log("OUT OF BOUNDS");
                        return;
                    } 

                    for(let i = 0; i < shipLength; i++){
                        const row = gridCoord[0] + i*shipAxis[0];
                        const col = gridCoord[1] + i*shipAxis[1];
                        const g = document.querySelector(`#${player.getName()}-div .grid[data-row="${row}"][data-col="${col}"]`);
                        if(g.dataset.ship_id) g.classList.remove('invalid-outline');
                        g.classList.remove('outline');
                    }
                }

                function moveMouseClick(e){
                    if (!selected) return;
                    const grid = e.target;
                    const gridCoord = [+grid.dataset.row, +grid.dataset.col];

                    if (!inBounds(gridCoord) || 
                    !inBounds([gridCoord[0] + (shipLength-1)*shipAxis[0], gridCoord[1] + (shipLength-1)* shipAxis[1]])){
                        console.log("OUT OF BOUNDS CLICK");
                        return;
                    } 

                    console.log(gridCoord);
                    if(!gameboard.placeShip(gridCoord, shipObj)) return;


                    shipGroup.forEach(s=>{
                        s.classList.remove('moving');
                        s.classList.remove('show');
                        const newS = s.cloneNode(true);
                        s.parentNode.replaceChild(newS, s);
                    });

                    console.log(gameboard.board);

                    for(let i = 0; i < shipLength; i++){
                        const row = gridCoord[0] + i*shipAxis[0];
                        const col = gridCoord[1] + i*shipAxis[1];
                        const g = document.querySelector(`#${player.getName()}-div .grid[data-row="${row}"][data-col="${col}"]`);
                        const newG = g.cloneNode(true);

                        newG.classList.add('show');
                        newG.classList.remove('outline');
                        newG.dataset.ship_id = shipObj.id;
                        newG.addEventListener('mouseover', selectShipMouseOver);
                        newG.addEventListener('mouseout', selectShipMouseOut);
                        newG.addEventListener('click', selectShipMouseClick);

                        g.parentNode.replaceChild(newG, g);
                    }

                    // ships.forEach(s=>{
                    //     s.style.pointerEvents = 'auto';
                    // });

                    selected = false;
                }
                function rotateShip(e){
                    if(!selected) return
                    if(e.key !== 'ArrowRight') return;
                    const grids = document.querySelectorAll(`#${player.getName()}-div .grid.outline`);
                    shipObj.rotateAxis(1);
                    grids.forEach(grid=>{
                        grid.classList.remove('outline');
                    });
                }
                window.addEventListener('keydown', rotateShip);
            }



            ship.addEventListener('mouseover', selectShipMouseOver);
            ship.addEventListener('mouseout', selectShipMouseOut);
            ship.addEventListener('click', selectShipMouseClick);
        });

    }

    function addGridAttackEventListener(player, nextPlayer,gameboard){
        const grids = document.querySelectorAll(`#${player.getName()}-div .grid`);
        grids.forEach(grid =>{
            grid.addEventListener('click', ()=>{
                if (!player.getTurn()) return;
                const coords = [+grid.dataset.row, +grid.dataset.col];
                const ret = gameboard.recieveAttack(coords);
                if (ret == -1 || ret == 1){
                    return;
                }
                else if(typeof(ret) == 'object'){
                    grid.classList.add('hit');
                    console.log(ret);
                    if (ret.isSunk()){
                        gameboard.shipSunk();
                    }
                }
                else{
                    grid.classList.add('miss');
                }
                player.finishTurn();
                nextPlayer.myTurn();
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
            grid.dataset.ship_id = ship.id;
            grid.classList.add('show');
        }

        return true;
    }

    function recreateBoard(){
        const grids = document.querySelectorAll('.grid');

        grids.forEach(grid=>{
            const newGrid = grid.cloneNode(true);
            newGrid.classList.remove('outline');
            grid.parentNode.replaceChild(newGrid, grid);
        });
    }

    return {initializeBoard, addGridAttackEventListener, placeShip, addShipMoveEventListener, hideShips, recreateBoard};
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
    domManager.addShipMoveEventListener(p1, g1);
    domManager.addShipMoveEventListener(p2, g2);

    window.addEventListener('keydown', (e)=>{
        if (e.key != 'Enter') return;
        console.log(e.key);
        domManager.recreateBoard();
        // Hide Phase
        domManager.hideShips();

        // Game Phase
        domManager.addGridAttackEventListener(p1, p2,g1);
        domManager.addGridAttackEventListener(p2, p1,g2);
    });


    const pollShipCount = (interval) => {
        return new Promise((resolve, reject)=>{
            setTimeout(()=>{
                if (g1.getShipCount() === 0) resolve(p2);
                if (g2.getShipCount() === 0) resolve(p1);
                resolve(null);
            }, interval);
        });
    }
    
    async function timeout(){
        let gameWinner = null;
        do{
            console.log("POLL");
            gameWinner = await pollShipCount(1000);
        }while(gameWinner == null);
        console.log("TEST");

        return gameWinner;
    }
    

    // Game End Poll for game state
    const winner = timeout()
        .then(x => {
            alert(x.getName() + "Is the Winner!");
        });


})(10,10);




/*
TODO:
    - Allow user to move ships -- implement clicking to move
    - Implement Game Phase
    - Allow rotation
    -- Add AI?
*/