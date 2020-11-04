export type PartialResult<TSuccess, TError> = {
	success: TSuccess,
	error: TError
};

export type Uuid = string;

export type FetcherIntegrationImplementation = () => Promise<void>;
