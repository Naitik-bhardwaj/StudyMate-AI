export const errorHandler = (err, req, res, next) => {
  console.error(err);

  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  if (err?.name === "MulterError" || err?.message === "Only PDF files are supported") statusCode = 400;

  res.status(statusCode).json({
    message: err.message || "Something went wrong on the server",
    ...(process.env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {}),
  });
};

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};
