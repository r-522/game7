export type OtokogiVerdict = 'シブイ' | 'シャバい'

export interface OtokogiRule {
  action: string
  delta: number
  verdict: OtokogiVerdict
}

export const OTOKOGI_RULES: OtokogiRule[] = [
  { action: '正々堂々の勝利', delta: 10, verdict: 'シブイ' },
  { action: '啖呵成功', delta: 5, verdict: 'シブイ' },
  { action: 'メンチ優勝', delta: 3, verdict: 'シブイ' },
  { action: '敗北', delta: -5, verdict: 'シャバい' },
  { action: '逃走', delta: -15, verdict: 'シャバい' },
  { action: '集団リンチ', delta: -20, verdict: 'シャバい' },
]

export function getOtokogiRank(otokogi: number): string {
  if (otokogi >= 90) return '伝説の番長'
  if (otokogi >= 70) return '無敵の番長'
  if (otokogi >= 50) return '一目置かれる番長'
  if (otokogi >= 30) return '見習い番長'
  if (otokogi >= 10) return 'ただのチンピラ'
  return 'シャバい奴'
}
