import dynamic from 'next/dynamic'
const P = dynamic(() => import('../../components/LoginPage'), { ssr: false })
export default function Page() { return <P /> }
