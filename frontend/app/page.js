import dynamic from 'next/dynamic'

const App = dynamic(() => import('../components/App'), { ssr: false,
  loading: () => (
    <div style={{ minHeight:'100vh', background:'#F7F3FF', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ width:36, height:36, borderRadius:'50%', border:'3px solid #E8E0F8', borderTopColor:'#9B5CF6', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
})

export default function Page() { return <App /> }
