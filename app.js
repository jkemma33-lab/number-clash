const columns = 9;
const copiesPerDigit = 4;
const maxAdds = 5;
const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const state = {
  rows: [],
  selected: null,
  cleared: 0,
  moves: 0,
  addsUsed: 0,
  lastAction: "Game started",
  invalidCell: null
};

const board = document.querySelector("#board");
const numbersLeft = document.querySelector("#numbers-left");
const clearedCount = document.querySelector("#cleared-count");
const moveCount = document.querySelector("#move-count");
const addsLeft = document.querySelector("#adds-left");
const status = document.querySelector("#status");
const guidance = document.querySelector("#guidance");
const selectedText = document.querySelector("#selected-text");
const lastAction = document.querySelector("#last-action");
const addNumbers = document.querySelector("#add-numbers");
const newGame = document.querySelector("#new-game");

function resetGame() {
  const numbers = shuffle(makeBalancedNumbers());
  state.rows = numbersToRows(numbers);
  state.selected = null;
  state.cleared = 0;
  state.moves = 0;
  state.addsUsed = 0;
  state.lastAction = "Game started";
  state.invalidCell = null;
  render();
}

function makeBalancedNumbers() {
  return Array.from({ length: 9 }, (_, index) => index + 1)
    .flatMap((number) => Array.from({ length: copiesPerDigit }, () => number));
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function numbersToRows(numbers) {
  const rowCount = Math.ceil(numbers.length / columns);
  return Array.from({ length: rowCount }, (_, row) => {
    return Array.from({ length: columns }, (_, column) => {
      const index = row * columns + column;
      return index < numbers.length ? numbers[index] : null;
    });
  });
}

function cellId(row, column) {
  return `${row}-${column}`;
}

function sameCell(first, second) {
  return first && second && first.row === second.row && first.column === second.column;
}

function getValue(position) {
  if (!position || !state.rows[position.row]) return null;
  return state.rows[position.row][position.column];
}

function currentNumbers() {
  return state.rows.flat().filter((value) => value !== null);
}

function handleCellClick(row, column) {
  if (isTerminal()) return;

  const clicked = { row, column };
  const value = getValue(clicked);
  if (value === null) return;

  state.invalidCell = null;

  if (!state.selected) {
    state.selected = clicked;
    state.lastAction = `Selected ${value}`;
    render();
    return;
  }

  if (sameCell(state.selected, clicked)) {
    state.selected = null;
    state.lastAction = "Selection cleared";
    render();
    return;
  }

  if (canClearPair(state.selected, clicked)) {
    clearPair(state.selected, clicked);
    state.selected = null;
    collapseEmptyRows();
    render();
    return;
  }

  state.invalidCell = clicked;
  state.selected = clicked;
  state.lastAction = "No match. Pick an equal number or a total of 10 in a clear line.";
  render();
}

function canClearPair(first, second) {
  const firstValue = getValue(first);
  const secondValue = getValue(second);
  if (firstValue === null || secondValue === null) return false;
  if (!isClearLine(first, second) && !isWrappedRowLine(first, second)) return false;
  return firstValue === secondValue || firstValue + secondValue === 10;
}

function isClearLine(first, second) {
  const rowDelta = second.row - first.row;
  const columnDelta = second.column - first.column;
  const rowStep = Math.sign(rowDelta);
  const columnStep = Math.sign(columnDelta);
  const aligned =
    rowDelta === 0 ||
    columnDelta === 0 ||
    Math.abs(rowDelta) === Math.abs(columnDelta);

  if (!aligned || (rowStep === 0 && columnStep === 0)) return false;

  let row = first.row + rowStep;
  let column = first.column + columnStep;

  while (row !== second.row || column !== second.column) {
    if (!state.rows[row] || state.rows[row][column] !== null) return false;
    row += rowStep;
    column += columnStep;
  }

  return true;
}

function isWrappedRowLine(first, second) {
  return isForwardWrappedRowLine(first, second) || isForwardWrappedRowLine(second, first);
}

function isForwardWrappedRowLine(first, second) {
  if (second.row !== first.row + 1) return false;

  for (let column = first.column + 1; column < columns; column += 1) {
    if (state.rows[first.row][column] !== null) return false;
  }

  for (let column = 0; column < second.column; column += 1) {
    if (state.rows[second.row][column] !== null) return false;
  }

  return true;
}

function clearPair(first, second) {
  const firstValue = getValue(first);
  const secondValue = getValue(second);

  state.rows[first.row][first.column] = null;
  state.rows[second.row][second.column] = null;
  state.cleared += 2;
  state.moves += 1;
  state.lastAction = `Cleared ${firstValue} and ${secondValue}`;
}

function collapseEmptyRows() {
  const before = state.rows.length;
  state.rows = state.rows.filter((row) => row.some((value) => value !== null));
  const removed = before - state.rows.length;

  if (removed > 0) {
    state.lastAction += ` / collapsed ${removed} empty row${removed === 1 ? "" : "s"}`;
  }
}

function addCurrentNumbers() {
  if (state.addsUsed >= maxAdds || isComplete()) return;

  const numbers = currentNumbers();
  if (numbers.length === 0) return;

  let insertion = nextInsertionPoint();
  for (const number of numbers) {
    while (insertion.column >= columns) {
      insertion.row += 1;
      insertion.column = 0;
    }
    ensureRow(insertion.row);
    state.rows[insertion.row][insertion.column] = number;
    insertion.column += 1;
  }

  state.addsUsed += 1;
  state.selected = null;
  state.invalidCell = null;
  state.lastAction = `Added ${numbers.length} numbers`;
  render();
}

function nextInsertionPoint() {
  for (let row = state.rows.length - 1; row >= 0; row -= 1) {
    for (let column = columns - 1; column >= 0; column -= 1) {
      if (state.rows[row][column] !== null) {
        return { row, column: column + 1 };
      }
    }
  }

  return { row: 0, column: 0 };
}

function ensureRow(row) {
  while (state.rows.length <= row) {
    state.rows.push(Array.from({ length: columns }, () => null));
  }
}

function numbersRemaining() {
  return currentNumbers().length;
}

function isComplete() {
  return numbersRemaining() === 0;
}

function isGameOver() {
  return !isComplete() && state.addsUsed >= maxAdds && !hasAvailableMove();
}

function isTerminal() {
  return isComplete() || isGameOver();
}

function hasAvailableMove() {
  for (let row = 0; row < state.rows.length; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      if (state.rows[row][column] === null) continue;
      if (directions.some(([rowStep, columnStep]) => hasMoveInDirection(row, column, rowStep, columnStep))) {
        return true;
      }
      if (hasWrappedRowMove(row, column)) return true;
    }
  }
  return false;
}

function hasMoveInDirection(row, column, rowStep, columnStep) {
  const from = { row, column };
  let candidateRow = row + rowStep;
  let candidateColumn = column + columnStep;

  while (candidateRow >= 0 && candidateRow < state.rows.length && candidateColumn >= 0 && candidateColumn < columns) {
    const value = state.rows[candidateRow][candidateColumn];
    if (value !== null) {
      return canClearPair(from, { row: candidateRow, column: candidateColumn });
    }
    candidateRow += rowStep;
    candidateColumn += columnStep;
  }

  return false;
}

function hasWrappedRowMove(row, column) {
  if (row + 1 >= state.rows.length) return false;

  const from = { row, column };
  for (let candidateColumn = column + 1; candidateColumn < columns; candidateColumn += 1) {
    if (state.rows[row][candidateColumn] !== null) return false;
  }

  for (let candidateColumn = 0; candidateColumn < columns; candidateColumn += 1) {
    if (state.rows[row + 1][candidateColumn] !== null) {
      return canClearPair(from, { row: row + 1, column: candidateColumn });
    }
  }

  return false;
}

function gameStatus() {
  if (isComplete()) return "Complete";
  if (isGameOver()) return "Game Over";
  if (!hasAvailableMove()) return "Add";
  return state.selected ? "Select Pair" : "Playing";
}

function guidanceText() {
  if (isComplete()) return "All numbers are cleared.";
  if (isGameOver()) return "No valid pairs remain and the add limit has been used.";
  if (!hasAvailableMove()) return "No valid pairs remain. Add numbers to continue.";
  if (state.selected) return "Choose a second number. No possible targets are highlighted.";
  return "Equal numbers or pairs totaling 10 can be cleared across empty spaces, including row-end wraps.";
}

function selectedLabel() {
  if (!state.selected) return "None";
  return `R${state.selected.row + 1} C${state.selected.column + 1}: ${getValue(state.selected)}`;
}

function render() {
  numbersLeft.textContent = numbersRemaining();
  clearedCount.textContent = state.cleared;
  moveCount.textContent = state.moves;
  addsLeft.textContent = maxAdds - state.addsUsed;
  status.textContent = gameStatus();
  guidance.textContent = guidanceText();
  selectedText.textContent = selectedLabel();
  lastAction.textContent = state.lastAction;
  addNumbers.disabled = state.addsUsed >= maxAdds || isComplete();

  board.replaceChildren(...state.rows.flatMap((row, rowIndex) => {
    return row.map((value, columnIndex) => renderCell(value, rowIndex, columnIndex));
  }));
}

function renderCell(value, row, column) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "cell";
  button.textContent = value === null ? "" : value;
  button.disabled = value === null || isTerminal();
  button.setAttribute("aria-label", cellLabel(value, row, column));

  if (value === null) button.classList.add("empty");
  if (state.selected && sameCell(state.selected, { row, column })) button.classList.add("selected");
  if (state.invalidCell && cellId(row, column) === cellId(state.invalidCell.row, state.invalidCell.column)) {
    button.classList.add("invalid");
  }

  button.addEventListener("click", () => handleCellClick(row, column));
  return button;
}

function cellLabel(value, row, column) {
  if (value === null) return `Empty cell, row ${row + 1}, column ${column + 1}`;
  return `${value}, row ${row + 1}, column ${column + 1}`;
}

addNumbers.addEventListener("click", addCurrentNumbers);
newGame.addEventListener("click", resetGame);
resetGame();
