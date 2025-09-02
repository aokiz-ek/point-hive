// 导出所有服务
export { authService } from './auth-service'
export { groupService } from './group-service'
export { transactionService } from './transaction-service'
export { strategyService } from './strategy-service'

// 导出类型
export type { AuthUser, SignInCredentials, SignUpCredentials, AuthResponse } from './auth-service'
export type { GroupServiceResponse } from './group-service'
export type { TransactionServiceResponse } from './transaction-service'
export type { StrategyServiceResponse, StrategyPlayer, StrategyGameSettings, StrategyGroup } from './strategy-service'