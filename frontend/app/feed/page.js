import dynamic from 'next/dynamic'
const P = dynamic(() => import('../../components/FeedPage'), { ssr: false })
export default function Page() { return <P /> }
