import dynamic from 'next/dynamic'
const P = dynamic(() => import('../../components/ProfilePage'), { ssr: false })
export default function Page() { return <P /> }
