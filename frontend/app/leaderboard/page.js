import dynamic from 'next/dynamic'
const P = dynamic(() => import('../../components/LeaderboardPage'), { ssr: false })
export default function Page() { return <P /> }
