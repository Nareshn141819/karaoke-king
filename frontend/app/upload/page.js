import dynamic from 'next/dynamic'
const P = dynamic(() => import('../../components/UploadPage'), { ssr: false })
export default function Page() { return <P /> }
