
import Head from 'next/head'
import WalletConnect from '../components/WalletConnect'
import styles from '../styles/Home.module.css'
import Link from 'next/link'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>GreenChain</title>
        <meta name="description" content="Carbon Credit Marketplace" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>
            Welcome to GreenChain!
          </h1>
          <p className={styles.description}>
            The transparent and secure marketplace for carbon credits.
          </p>
          <div className={styles.cta}>
            <Link legacyBehavior href="/market">
              <a className={styles.button}>Explore Marketplace</a>
            </Link>
            <Link legacyBehavior href="/register">
              <a className={styles.button}>Get Started</a>
            </Link>
          </div>
        </div>

        <div className={styles.section}>
          <h2>How It Works</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>1. Register</h3>
              <p>Create an account as an NGO or a Company.</p>
            </div>
            <div className={styles.card}>
              <h3>2. List & Buy</h3>
              <p>NGOs can list carbon credits, and companies can buy them.</p>
            </div>
            <div className={styles.card}>
              <h3>3. Secure Transactions</h3>
              <p>All transactions are secured by the Ethereum blockchain.</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2>Featured Listings</h2>
          {/* Add featured listings here */}
        </div>

        <WalletConnect />
      </main>
    </div>
  )
}
