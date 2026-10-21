import Link from "next/link";
export default function NotFound() {
  return <div className="page-wrap"><div className="card-surface" style={{padding:40,maxWidth:560,margin:"50px auto"}}><div className="eyebrow">404 / OFF TRACK</div><h1 style={{fontFamily:"Manrope",fontSize:32}}>This route isn&rsquo;t in the arena.</h1><p style={{color:"#7c8999",lineHeight:1.7}}>Head back to the overview and choose a competition track.</p><Link className="button button-primary" href="/">Back to overview</Link></div></div>;
}
