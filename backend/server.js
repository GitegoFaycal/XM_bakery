// Local entry point. On Vercel, api/index.js exports the same app instead.
import app from './app.js';

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
