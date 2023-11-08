const Ship = (length, axis)=>{
    this.length = length;
    this.axis = axis; // [0, 1] => going right, [0, -1] => going left, [1, 0] => going down [-1, 0] => going up
    this.hit = 0;
    this.sunk = false;

    const hit = ()=>{this.hit++};
    const isSunk = ()=>{return this.length === this.hit};
    return {hit, isSunk}
};

const s1 = Ship(5, [0,1]);

const GameBoard = (n,m) =>{
    this.rows = n;
    this.cols = m;
    this.board = new Array(n).fill().map(()=>new Array(m).fill(0));

    console.log(this.board);

    const placeShip = (startCoord, ship)=>{
        
    };

    const recieveAttack = (coords)=>{

    }
 

    return {placeShip};
}

const Player = () =>{
    this.turn = false;

    const getTurn = () =>{return this.turn};
    const setTurn = () =>{this.turn = true};

    const finishTurn = () =>{this.turn = false};

    return {getTurn, setTurn, finishTurn};
}

const g1 = GameBoard(8,8);