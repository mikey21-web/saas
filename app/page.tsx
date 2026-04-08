import Header from '../components/Header'
import HeroSection from '../components/HeroSection'
import FeaturesBento from '../components/FeaturesBento'
import Footer from '../components/Footer'

export default function RootPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesBento />
      </main>
      <Footer />
    </>
  )
}
