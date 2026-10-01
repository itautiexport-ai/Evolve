const styleSuffix = ", beautiful cozy Studio Ghibli anime illustration, warm sunbeams, soft pastel colors, detailed hand-drawn aesthetic, clean and safe, high quality";
const prompt = "a cozy classic vintage blue car parked on a scenic countryside road surrounded by cherry blossoms and wild flowers" + styleSuffix;
const seed = 12345;
const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true&seed=${seed}`;

console.log("Fetching URL:", imageUrl);

try {
  const res = await fetch(imageUrl);
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
} catch (err) {
  console.error("Error:", err);
}
