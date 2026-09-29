import fs from 'node:fs'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { asc, eq, and } from 'drizzle-orm'
import * as schema from './schema'
import { users, games, userGames, archetypes, matches } from './schema'

// Charger le fichier .env si non défini dans l'environnement
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const match = line.match(/^([^#=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const val = match[2].trim().replace(/^['"](.*)['"]$/, '$1')
          if (!process.env[key]) {
            process.env[key] = val
          }
        }
      }
    }
  } catch {}
}

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matchup_tracking'

interface SeedArchetype {
  name: string
  card1Name: string
  card1ImageUrl?: string
  card2Name: string
  card2ImageUrl?: string
}

interface SeedGame {
  name: string
  slug: string
  logoUrl?: string
  archetypes: SeedArchetype[]
}

const seedData: SeedGame[] = [
  {
    name: 'Riftbound',
    slug: 'riftbound',
    logoUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120&auto=format&fit=crop&q=80',
    archetypes: [
      {
        name: 'Irelia Tempo',
        card1Name: 'Irelia, Danseuse des Lames',
        card1ImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Ruée',
        card2ImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Rengar Assassin',
        card1Name: 'Rengar, Prédateur',
        card1ImageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Férocité',
        card2ImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Kassadin Void Control',
        card1Name: 'Kassadin',
        card1ImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Faille Temporelle',
        card2ImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    name: 'Pokémon TCG',
    slug: 'pokemon-tcg',
    logoUrl: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png',
    archetypes: [
      {
        name: 'Dracaufeu ex / Pidgeot',
        card1Name: 'Dracaufeu ex',
        card1ImageUrl: 'https://images.pokemontcg.io/sv3pt5/6_hires.png',
        card2Name: 'Roucarnage ex',
        card2ImageUrl: 'https://images.pokemontcg.io/sv3/164_hires.png'
      },
      {
        name: 'Gardevoir ex',
        card1Name: 'Gardevoir ex',
        card1ImageUrl: 'https://images.pokemontcg.io/sv1/86_hires.png',
        card2Name: 'Kirlia (Raffinement)',
        card2ImageUrl: 'https://images.pokemontcg.io/sv1/85_hires.png'
      },
      {
        name: 'Lugia VSTAR / Archeops',
        card1Name: 'Lugia VSTAR',
        card1ImageUrl: 'https://images.pokemontcg.io/swsh12/139_hires.png',
        card2Name: 'Aéroptéryx',
        card2ImageUrl: 'https://images.pokemontcg.io/swsh12/147_hires.png'
      },
      {
        name: 'Miraidon ex Regieleki',
        card1Name: 'Miraidon ex',
        card1ImageUrl: 'https://images.pokemontcg.io/sv1/81_hires.png',
        card2Name: 'Regieleki VMAX',
        card2ImageUrl: 'https://images.pokemontcg.io/swsh12/58_hires.png'
      }
    ]
  },
  {
    name: 'One Piece Card Game',
    slug: 'one-piece-card-game',
    logoUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=120&auto=format&fit=crop&q=80',
    archetypes: [
      {
        name: 'Luffy Rouge / Gear 5',
        card1Name: 'Monkey D. Luffy (ST10)',
        card1ImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Radical Beam',
        card2ImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Law Vert/Jaune Supernovas',
        card1Name: 'Trafalgar Law',
        card1ImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Eustass Kid',
        card2ImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Doflamingo Bleu Warlords',
        card1Name: 'Donquixote Doflamingo',
        card1ImageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Boa Hancock',
        card2ImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Katakuri Jaune Big Mom',
        card1Name: 'Charlotte Katakuri',
        card1ImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80',
        card2Name: '10c Big Mom',
        card2ImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80'
      }
    ]
  },
  {
    name: 'Star Wars: Unlimited',
    slug: 'star-wars-unlimited',
    logoUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=120&auto=format&fit=crop&q=80',
    archetypes: [
      {
        name: 'Sabine Green Aggro',
        card1Name: 'Sabine Wren',
        card1ImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=200&auto=format&fit=crop&q=80',
        card2Name: 'For a Cause I Believe In',
        card2ImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Boba Fett Yellow Midrange',
        card1Name: 'Boba Fett',
        card1ImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Firespray',
        card2ImageUrl: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=200&auto=format&fit=crop&q=80'
      },
      {
        name: 'Iden Blue Control',
        card1Name: 'Iden Versio',
        card1ImageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80',
        card2Name: 'Superlaser Blast',
        card2ImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80'
      }
    ]
  }
]

async function seed() {
  console.log('🌱 Starting database seeding...')
  console.log(`Connecting to: ${connectionString}`)

  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    // 1. Trouver le premier utilisateur admin
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .orderBy(asc(users.createdAt))
      .limit(1)
      .then(rows => rows[0])

    if (!adminUser) {
      console.warn('⚠️ Aucun utilisateur admin trouvé dans la base de données.')
      console.warn('Veuillez d\'abord vous connecter avec Discord OAuth pour créer le compte admin initial.')
      await client.end()
      process.exit(0)
    }

    console.log(`👤 Admin trouvé: ${adminUser.username} (${adminUser.id})`)

    // 2. Traitement pour chaque jeu
    for (const gameData of seedData) {
      console.log(`\n🎮 Traitement du jeu: ${gameData.name} (${gameData.slug})`)

      // Vérifier si le jeu existe déjà
      let existingGame = await db
        .select()
        .from(games)
        .where(eq(games.slug, gameData.slug))
        .limit(1)
        .then(rows => rows[0])

      if (!existingGame) {
        // Insérer le jeu
        const [insertedGame] = await db
          .insert(games)
          .values({
            name: gameData.name,
            slug: gameData.slug,
            logoUrl: gameData.logoUrl || null
          })
          .returning()
        existingGame = insertedGame
        console.log(`   + Jeu créé: ${existingGame.name} (id: ${existingGame.id})`)
      } else {
        console.log(`   = Jeu existant: ${existingGame.name} (id: ${existingGame.id})`)
      }

      // Lier le jeu à l'admin dans user_games
      await db
        .insert(userGames)
        .values({
          userId: adminUser.id,
          gameId: existingGame.id
        })
        .onConflictDoNothing()
      console.log(`   🔗 Lié à l'admin ${adminUser.username}`)

      // 3. Insérer les archétypes pour ce compte admin
      const insertedArchetypeMap: Record<string, string> = {}

      for (const arch of gameData.archetypes) {
        const existingArch = await db
          .select()
          .from(archetypes)
          .where(
            and(
              eq(archetypes.userId, adminUser.id),
              eq(archetypes.gameId, existingGame.id),
              eq(archetypes.name, arch.name)
            )
          )
          .limit(1)
          .then(rows => rows[0])

        if (!existingArch) {
          const [inserted] = await db
            .insert(archetypes)
            .values({
              userId: adminUser.id,
              gameId: existingGame.id,
              name: arch.name,
              card1Name: arch.card1Name,
              card1ImageUrl: arch.card1ImageUrl || null,
              card2Name: arch.card2Name,
              card2ImageUrl: arch.card2ImageUrl || null,
              isArchived: false
            })
            .returning()
          insertedArchetypeMap[arch.name] = inserted.id
          console.log(`   + Archétype créé: ${arch.name}`)
        } else {
          insertedArchetypeMap[arch.name] = existingArch.id
          console.log(`   = Archétype déjà présent: ${arch.name}`)
        }
      }

      // 4. Injecter quelques matchs de démo pour le premier deck si aucun match n'existe encore
      const archKeys = Object.keys(insertedArchetypeMap)
      if (archKeys.length >= 2) {
        const myDeckId = insertedArchetypeMap[archKeys[0]]
        const existingMatches = await db
          .select()
          .from(matches)
          .where(and(eq(matches.userId, adminUser.id), eq(matches.myArchetypeId, myDeckId)))
          .limit(1)

        if (existingMatches.length === 0) {
          console.log(`   🎲 Ajout de matchs d'exemple pour le deck actif ${archKeys[0]}...`)
          for (let i = 1; i < archKeys.length; i++) {
            const oppId = insertedArchetypeMap[archKeys[i]]
            // 2 victoires, 1 défaite par adversaire pour animer les stats
            await db.insert(matches).values([
              {
                userId: adminUser.id,
                gameId: existingGame.id,
                myArchetypeId: myDeckId,
                opponentArchetypeId: oppId,
                result: 'win',
                notes: 'Bonne sortie'
              },
              {
                userId: adminUser.id,
                gameId: existingGame.id,
                myArchetypeId: myDeckId,
                opponentArchetypeId: oppId,
                result: 'loss',
                notes: 'Manque de ressources'
              },
              {
                userId: adminUser.id,
                gameId: existingGame.id,
                myArchetypeId: myDeckId,
                opponentArchetypeId: oppId,
                result: 'win',
                notes: 'Victoire au tour 6'
              }
            ])
          }
          console.log(`   ✅ Matchs de démonstration insérés avec succès.`)
        }
      }
    }

    console.log('\n✨ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error while seeding database:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

seed()
