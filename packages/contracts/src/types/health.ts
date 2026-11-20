export type HealthCheckResponse = {
  status: string;
  database: {
    status: string;
    message?: string;
  };
};
