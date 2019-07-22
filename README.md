# insert-buffer
Node JS thing to which you can add data and it will spit out MySQL compliant bulk insert statement.

## Usage
You keep adding rows to the buffer and every _n_ rows it will drain the buffer and emit a drain event with the bulk insert statment and bound data. You should always run `end()` as the final step to clear the buffer.

```js
const buffer = new InsertBuffer('Schema.table_name');

buffer.on('drain', (query, bind) => {
    console.log(query, bind);
});

buffer.add({col1: 'Some value', col2: 1});
buffer.add({col1: 'Another value', col2: 2});

// Run end() to clear up buffer
buffer.end();
```
The above should output something like:

```SQL
INSERT
INTO Schema.table_name (`col1`, `col2`) VALUES
(?, ?),
(?, ?);
```
Along with the bound data array like:
```JS
[ 'Some value', 1, 'Another value', 2 ]
```

## Options
The contructor takes a second options argument, which defaults to:
```JS
{
    size: 1000,
    useIgnore: false,
    useReplace: false,
    onDuplicateKeyUpdate: false,
}
```

### size
`size` defines the number of rows that can be added to the buffer before the buffer is drained and the `drain` event is emitted. Defaults to `1000`.

### useIgnore
Set `useIgnore` to `true` to make the output into a `INSERT IGNORE INTO...` statement. Defaults to `false`.

### useReplace
Set `useReplace` to `true` to make the output into a `REPLACE INTO...` statement. Defaults to `false`.

### onDuplicateKeyUpdate
Define an `onDuplicateKeyUpdate` string which will allow you to define what to do with the data when a duplicate key is detected. Defaults to `false`. Example:

```js
const buffer = new InsertBuffer('Schema.table_name', {
    onDuplicateKeyUpdate: 'col1 = values(col1)'
});

buffer.on('drain', (query, bind) => console.log(query, bind));
buffer.add({col1: 'Some value', col2: 1});
buffer.end();
```
Output:
```SQL
INSERT
INTO Schema.table_name (`col1`, `col2`) VALUES
(?, ?),
(?, ?)
ON DUPLICATE KEY UPDATE col1 = values(col1);
```