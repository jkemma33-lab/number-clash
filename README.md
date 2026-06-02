# Number Clash Web

This is a browser-playable version of Number Clash.

- The board is 9 columns wide and can grow downward.
- The initial board uses 34 shuffled numbers: one random digit appears twice, and the other eight digits appear four times each.
- Select two cells in a straight horizontal, vertical, or diagonal line.
- The pair disappears when the two numbers are equal or add up to 10.
- Empty cells may be crossed, so a valid target can be several cells away.
- If every cell to the right of a number is empty, the first number from the left in the next row is also a valid line target.
- Other valid targets are not highlighted after selecting a number.
- When every cell in a row is cleared, all rows below it move up by one row.
- Press `Add Numbers` to copy all currently remaining numbers and append them after the rightmost number in the lowest occupied row.
- `Add Numbers` can be used up to five times.
- When every number is cleared, a fresh set of 34 numbers is dealt and the game continues.
- The add counter does not reset when a fresh set is dealt.
- The game ends when no valid pair remains after all five additions are used.

## Run

Open `index.html` in a browser.

No build step or package install is required.
