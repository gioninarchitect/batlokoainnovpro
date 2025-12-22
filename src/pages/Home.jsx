import { Helmet } from 'react-helmet-async'
import Hero from '@sections/home/Hero'
import ProductGrid from '@sections/home/ProductGrid'
import CompanyOverview from '@sections/home/CompanyOverview'
import WhyChooseUs from '@sections/home/WhyChooseUs'
import ContactCTA from '@sections/home/ContactCTA'

function Home() {
  return (
    <>
      <Helmet>
        <title>Batlokoa Innovative Projects | Engineering Excellence for South Africa</title>
        <meta name="description" content="Your trusted partner for mining, construction & engineering supplies. 100% Black-Women-Owned, Level 1 BBB-EE Company based in Gauteng." />
        <meta property="og:title" content="Batlokoa Innovative Projects | Engineering Supplies" />
        <meta property="og:description" content="Your one-stop shop for all engineering solutions and supplies. Quality products delivered right to your doorstep." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://batlokoainnovpro.co.za/" />
      </Helmet>

      <Hero />
      <ProductGrid />
      <CompanyOverview />
      <WhyChooseUs />
      <ContactCTA />
    </>
  )
}

export default Home
