import { Worker } from "bullmq";

const redisUrl = process.env.REDIS_URL ?? "redis://redis:6379";

const worker = new Worker(
  "domain-manager-system",
  async (job) => {
    console.log(
      JSON.stringify({
        level: "info",
        service: "worker",
        message: "Job received",
        jobId: job.id,
        jobName: job.name,
      }),
    );
  },
  {
    connection: {
      url: redisUrl,
      maxRetriesPerRequest: null,
    },
  },
);

worker.on("ready", () => {
  console.log(
    JSON.stringify({
      level: "info",
      service: "worker",
      message: "Domain Manager worker ready",
    }),
  );
});

worker.on("failed", (job, error) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "worker",
      message: "Job failed",
      jobId: job?.id,
      error: error.message,
    }),
  );
});

worker.on("error", (error) => {
  console.error(
    JSON.stringify({
      level: "error",
      service: "worker",
      message: "Worker connection error",
      error: error.message,
    }),
  );
});

async function shutdown(signal: string): Promise<void> {
  console.log(
    JSON.stringify({
      level: "info",
      service: "worker",
      message: "Worker shutdown requested",
      signal,
    }),
  );

  await worker.close();
  process.exit(0);
}

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});
