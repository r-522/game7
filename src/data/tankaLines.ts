export interface TankaSet {
  setup: string
  options: string[]
  correctIndex: number
}

export const TANKA_TABLE: TankaSet[] = [
  {
    setup: '「お前、この街でイキってんの？」',
    options: ['「うるせえ、かかってこい！」', '「そうだが？文句あっか！」', '「すみません許してください」'],
    correctIndex: 1,
  },
  {
    setup: '「俺の縄張りを荒らしたのはお前か？」',
    options: ['「知らん、他を当たれ」', '「ああ、俺だ。何か問題あるか？」', '「違います！間違いです！」'],
    correctIndex: 1,
  },
  {
    setup: '「お前の噂は聞いてるぜ。強いらしいな」',
    options: ['「噂通りだ。自分で確かめてみろ」', '「いや、俺なんか全然ですよ」', '「誰から聞いたんだ？」'],
    correctIndex: 0,
  },
  {
    setup: '「ここは俺たちのシマだ。通行料を払え」',
    options: ['「わかった、いくら？」', '「シマ代なら拳で払ってやる」', '「すみません、引き返します」'],
    correctIndex: 1,
  },
  {
    setup: '「最後に後悔するのはお前だぞ」',
    options: ['「後悔? そりゃお前の方だ」', '「怖いからやめましょう」', '「……考えさせてください」'],
    correctIndex: 0,
  },
  {
    setup: '「お前、喧嘩なんて向いてないんじゃないか?」',
    options: ['「そうかもな、でも退かんぞ」', '「そうですね、帰ります」', '「否定はしない、でも勝つ」'],
    correctIndex: 2,
  },
  {
    setup: '「仲間を呼ぼうか？」',
    options: ['「呼べるもんなら呼んでみろ」', '「お願い、やめてください！」', '「……逃げよう」'],
    correctIndex: 0,
  },
  {
    setup: '「お前みたいな奴、一人で来るなんて度胸あるな」',
    options: ['「一人で十分だ」', '「仲間がいた方がよかった？」', '「度胸じゃなくて無謀かもね」'],
    correctIndex: 0,
  },
]

export function getRandomTanka(): TankaSet {
  return TANKA_TABLE[Math.floor(Math.random() * TANKA_TABLE.length)]
}
