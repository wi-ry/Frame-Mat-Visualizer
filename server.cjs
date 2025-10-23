const express = require("express");
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static("public"));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
