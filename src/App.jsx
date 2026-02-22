import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Octokit } from 'octokit'
import './App.css'
import searchIcon from './assets/search-icon.png'

import { GoogleGenAI } from '@google/genai'
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || import.meta.env.VITE_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY 
const SERPAPI_KEY = import.meta.env.VITE_SERPAPI_KEY || import.meta.env.SERPAPI_KEY
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null


 
 
const octokit = new Octokit({ auth: GITHUB_TOKEN })

function buildJobTags(job) {
  const extensionTags = Array.isArray(job.extensions) ? job.extensions : []
  const detected = job.detected_extensions || {}
  const rawTags = [
    ...extensionTags,
    detected.schedule_type,
    detected.posted_at,
    detected.salary,
    job.via ? `via ${job.via}` : '',
  ]

  return [...new Set(rawTags.map((tag) => String(tag || '').trim()).filter(Boolean))].slice(0, 6)
}

function normalizeJobPosting(job, index) {
  const applyLink = Array.isArray(job.apply_options) ? job.apply_options.find((option) => option?.link)?.link : ''
  const relatedLink = Array.isArray(job.related_links) ? job.related_links.find((option) => option?.link)?.link : ''
  const fallbackLink = job.share_link || ''
  const title = job.title || 'Untitled role'
  const companyName = job.company_name || 'Unknown company'

  return {
    id: job.job_id || `${title}-${companyName}-${index}`,
    title,
    companyName,
    location: job.location || 'Location not listed',
    description: job.description || 'No description provided.',
    image: job.thumbnail || '',
    link: applyLink || relatedLink || fallbackLink,
    tags: buildJobTags(job),
  }
}
// r
function Home({
  currentRepository,
  currentJob,
  onPickImage,
  fetchNews,
  loading,
  error,
  jobsError,
  previousRepositories,
  previousJobs,
  searchRepositories,
}) {
  const [expandedRepoDescriptions, setExpandedRepoDescriptions] = useState([])
  const [expandedJobDescriptions, setExpandedJobDescriptions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')

  const toggleRepoDescription = (id) => {
    setExpandedRepoDescriptions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleJobDescription = (id) => {
    setExpandedJobDescriptions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSearch = () => {
    searchRepositories(searchTerm)
  }

  return (
    <>
      <div className="title">TechNerd</div>

      
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search repositories and jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch()
            }
          }}
        />
        <button
          type="button"
          className="search-icon-button"
          aria-label="Search repositories and jobs"
          onClick={handleSearch}
        >
          <img src={searchIcon} alt="" className="search-icon" />
        </button>
      </div>



      <div className="featured-layout">
        <div className="image-container">
          {currentRepository ? (
            <>
              <a href={currentRepository.html_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={currentRepository.owner.avatar_url}
                  alt={`${currentRepository.owner.avatar_url}`}
                  title={`${currentRepository.owner.login}`}
                  width={250}
                  height={250}
                  style={{ backgroundColor: 'transparent', aspectRatio: '3/2', marginTop: '1.5em', cursor: 'pointer' }}
                  onClick={() => onPickImage(currentRepository.owner.avatar_url)}
                />
              </a>
              <div>
                {currentRepository.topics?.length
                  ? currentRepository.topics.map((topic) => (
                      <button className="topics" key={topic} type="button">
                        {topic}
                      </button>
                    ))
                  : null}
              </div>
              <hr />
              <button title="Language" type="button">
                {currentRepository.language || 'No language info'}
              </button>
              <br />
              <button title="Name" type="button">
                {currentRepository.name}
              </button>
              <br />
              <button title="License" type="button">
                {currentRepository.license ? currentRepository.license.name : 'No license info'}
              </button>
              <br />
              <button title="Stars" type="button">
                {currentRepository.stargazers_count}
              </button>
              <br />
              <button title="Forks" type="button">
                {currentRepository.forks_count}
              </button>
            </>
          ) : (
            <p>No image fetched yet.</p>
          )}
        </div>
        <div className="image-container job-container">
          {currentJob ? (
            <>
              {currentJob.link ? (
                <a href={currentJob.link} target="_blank" rel="noopener noreferrer" className="job-image-link">
                  {currentJob.image ? (
                    <img
                      src={currentJob.image}
                      alt={`${currentJob.title} at ${currentJob.companyName}`}
                      title={`${currentJob.companyName}`}
                      width={250}
                      height={250}
                    />
                  ) : (
                    <div className="job-image-placeholder">No job image available</div>
                  )}
                </a>
              ) : currentJob.image ? (
                <img
                  src={currentJob.image}
                  alt={`${currentJob.title} at ${currentJob.companyName}`}
                  title={`${currentJob.companyName}`}
                  width={250}
                  height={250}
                />
              ) : (
                <div className="job-image-placeholder">No job image available</div>
              )}
              <div className="job-tags">
                {currentJob.tags?.length
                  ? currentJob.tags.map((tag) => (
                      <button className="topics" key={`${currentJob.id}-${tag}`} type="button">
                        {tag}
                      </button>
                    ))
                  : null}
              </div>
              <hr />
              <button title="Role" type="button">
                {currentJob.title}
              </button>
              <br />
              <button title="Company" type="button">
                {currentJob.companyName}
              </button>
              <br />
              <button title="Location" type="button">
                {currentJob.location}
              </button>
            </>
          ) : (
            <p>Search by keyword to fetch matching job postings.</p>
          )}
        </div>

      </div>
      <div>
        {loading ? <div className="loader" aria-label="loading" /> : null}
        {error ? <p className="muted">{error}</p> : null}
        {jobsError ? <p className="muted">{jobsError}</p> : null}
      </div>
      <button onClick={fetchNews}>Fetch Repository</button>

      <div className="previous-images">
        <h3>Previous Repositories</h3>
        {previousRepositories?.length ? (
          <div className="previous-grid">
            {previousRepositories.map((repo) => {
              const cardId = repo.id || `${repo.owner.login}-${repo.name}`
              const isExpanded = expandedRepoDescriptions.includes(cardId)

              return (
                <div className="previous-card" key={cardId}>
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer">
                    <img src={repo.owner.avatar_url} alt={repo.owner.login} />
                  </a>
                  <p className={`previous-description ${isExpanded ? 'is-expanded' : ''}`}>
                    {repo.description || 'No description provided.'}
                  </p>
                  {repo.description && repo.description.length > 120 ? (
                    <button type="button" className="previous-toggle" onClick={() => toggleRepoDescription(cardId)}>
                      {isExpanded ? 'Show less' : 'Show full description'}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="muted">No previous repositories.</p>
        )}
      </div>

      <div className="previous-images">
        <h3>Previous Jobs</h3>
        {previousJobs?.length ? (
          <div className="previous-grid">
            {previousJobs.map((job) => {
              const cardId = job.id || `${job.title}-${job.companyName}`
              const isExpanded = expandedJobDescriptions.includes(cardId)

              return (
                <div className="previous-card" key={cardId}>
                  {job.link ? (
                    <a href={job.link} target="_blank" rel="noopener noreferrer" className="job-image-link">
                      {job.image ? (
                        <img src={job.image} alt={`${job.title} at ${job.companyName}`} />
                      ) : (
                        <div className="job-image-placeholder">No job image available</div>
                      )}
                    </a>
                  ) : job.image ? (
                    <img src={job.image} alt={`${job.title} at ${job.companyName}`} />
                  ) : (
                    <div className="job-image-placeholder">No job image available</div>
                  )}
                  <div className="previous-job-tags">
                    {job.tags?.map((tag) => (
                      <span key={`${cardId}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                  <p className={`previous-description ${isExpanded ? 'is-expanded' : ''}`}>
                    {job.description || 'No description provided.'}
                  </p>
                  {job.description && job.description.length > 120 ? (
                    <button type="button" className="previous-toggle" onClick={() => toggleJobDescription(cardId)}>
                      {isExpanded ? 'Show less' : 'Show full description'}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="muted">No previous jobs.</p>
        )}
      </div>
    </>
  )
}

function App() {
  const [currentRepository, setCurrentRepository] = useState(null)
  const [previousRepositories, setPreviousRepositories] = useState([])
  const [currentJob, setCurrentJob] = useState(null)
  const [previousJobs, setPreviousJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [jobsError, setJobsError] = useState('')
  const [ , setCounter] = useState(0)
  const selectRepository = (repo) => {
    if (currentRepository) {
      setPreviousRepositories((prev) => [currentRepository, ...prev.filter((r) => r.id !== currentRepository.id)])
    }

    setCounter((prev) => prev + 1)
    setCurrentRepository(repo ? { ...repo, topics: repo.topics || [] } : null)
  }

  const selectJob = (job) => {
    if (currentJob) {
      setPreviousJobs((prev) => [currentJob, ...prev.filter((entry) => entry.id !== currentJob.id)])
    }
    setCurrentJob(job || null)
  }

  async function fetchJobsByKeyword(query) {
    setJobsError('')
    if (!SERPAPI_KEY) {
      setCurrentJob(null)
      setJobsError('Missing SerpAPI key. Add VITE_SERPAPI_KEY to .env and restart the dev server.')
      return
    }

    try {
      const params = new URLSearchParams({
        engine: 'google_jobs',
        q: query,
        gl: 'us',
        hl: 'en',
        api_key: SERPAPI_KEY,
      })
      const response = await fetch(`/api/serpapi/search.json?${params.toString()}`)
      if (!response.ok) {
        throw new Error(`SerpAPI request failed with status ${response.status}`)
      }

      const data = await response.json()
      const rawJobs = Array.isArray(data.jobs_results) ? data.jobs_results : []
      const normalizedJobs = rawJobs.map((job, index) => normalizeJobPosting(job, index))

      if (normalizedJobs.length === 0) {
        setCurrentJob(null)
        setJobsError('No job postings were found for this keyword.')
        return
      }

      selectJob(normalizedJobs[0])
    } catch (err) {
      console.error('SerpAPI jobs search failed:', err)
      setCurrentJob(null)
      setJobsError('Unable to fetch job postings right now. Try another keyword.')
    }
  }

  async function loadFeatured() {
    setLoading(true)
     
    setError('')
    try {
      if (!ai) {
        throw new Error('Missing Gemini key. Add VITE_GEMINI_API_KEY to .env and restart the dev server.')
      } 
      const licenseResp = await octokit.request('GET /licenses')
      const openLicenses = licenseResp.data.filter((item) => item.key !== 'cc0-1.0').map((item) => item.key) 
      
      const orgResp = await octokit.rest.search.users({ q: 'type:org', per_page: 200 })
      const orgs = orgResp.data.items || []
      if (orgs.length === 0) throw new Error('No organizations found.')
      const org = orgs[Math.floor(Math.random() * orgs.length)] 
       
       
      const repoSearch = await octokit.rest.search.repos({
        q: `org:${org.login} stars:>100 forks:>20`,
        sort: 'stars', 
        order: 'desc',
        per_page: 30,
        headers: { accept: 'application/vnd.github.mercy-preview+json' },
      })

      let repoList = repoSearch.data.items || []
      repoList = repoList.filter((repo) => (repo.license ? openLicenses.includes(repo.license.key) : false))
      if (repoList.length === 0) repoList = repoSearch.data.items || []
      if (repoList.length === 0) throw new Error('No repositories found for the selected org.')

      const repo = repoList[Math.floor(Math.random() * repoList.length)]
      console.log('Selected repository:', repo) 
      selectRepository(repo) 
      await GoogleGenAISearch(repo)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to fetch news. Try again.')
    } finally {
      setLoading(false)
    }
  }
  async function searchRepositories(query) {
    const normalizedQuery = query?.trim()
    if (!normalizedQuery) {
      setError('Please enter a search query.')
      setJobsError('')
      return
    }

    setLoading(true)
    setError('')
    const jobsPromise = fetchJobsByKeyword(normalizedQuery)
    let matchedRepo = null

    try {
      try {
        const orgsResp = await octokit.rest.search.users({
          q: `${normalizedQuery} type:org in:login`,
          per_page: 20,
        })
        const orgs = orgsResp.data.items || []
        if (orgs.length === 0) throw new Error('No organizations found.')

        const orgReposResp = await octokit.rest.search.repos({
          q: `org:${orgs[0].login} ${normalizedQuery} in:name`,
          sort: 'stars',
          order: 'desc',
          per_page: 30,
          headers: { accept: 'application/vnd.github.mercy-preview+json' },
        })
        const orgRepos = orgReposResp.data.items || []
        if (orgRepos.length === 0) throw new Error('No organization repositories found.')

        matchedRepo = orgRepos[0]
      } catch {
        // Fall through to the next fallback.
      }

      if (!matchedRepo) {
        try {
          const nameRepoResp = await octokit.rest.search.repos({
            q: `${normalizedQuery} in:name`,
            sort: 'stars',
            order: 'desc',
            per_page: 30,
            headers: { accept: 'application/vnd.github.mercy-preview+json' },
          })
          const nameRepos = nameRepoResp.data.items || []
          if (nameRepos.length === 0) throw new Error('No repositories found by name.')

          matchedRepo = nameRepos[0]
        } catch {
          // Fall through to the next fallback.
        }
      }

      if (!matchedRepo) {
        try {
          const usersResp = await octokit.rest.search.users({
            q: `${normalizedQuery} type:user in:login`,
            per_page: 20,
          })
          const users = usersResp.data.items || []
          if (users.length === 0) throw new Error('No users found.')

          const userReposResp = await octokit.rest.search.repos({
            q: `user:${users[0].login} ${normalizedQuery} in:name`,
            sort: 'updated',
            order: 'desc',
            per_page: 30,
            headers: { accept: 'application/vnd.github.mercy-preview+json' },
          })
          const userRepos = userReposResp.data.items || []
          if (userRepos.length === 0) throw new Error('No repositories found for matching users.')

          matchedRepo = userRepos[0]
        } catch {
          // Fall through to the next fallback.
        }
      }

      if (!matchedRepo) {
        try {
          const bioUsersResp = await octokit.rest.search.users({
            q: `${normalizedQuery} in:bio type:user`,
            per_page: 20,
          })
          const bioUsers = bioUsersResp.data.items || []
          if (bioUsers.length === 0) throw new Error('No users found by bio.')

          const bioReposResp = await octokit.rest.repos.listForUser({
            username: bioUsers[0].login,
            sort: 'updated',
            per_page: 30,
          })
          const bioRepos = bioReposResp.data || []
          const bioMatch =
            bioRepos.find((repo) => (repo.description || '').toLowerCase().includes(normalizedQuery.toLowerCase())) ||
            bioRepos[0]

          if (!bioMatch) throw new Error('No repositories found for bio match.')
          matchedRepo = bioMatch
        } catch {
          // Fall through to the next fallback.
        }
      }

      if (!matchedRepo) {
        try {
          const readmeCodeResp = await octokit.rest.search.code({
            q: `${normalizedQuery} in:file filename:README.md`,
            per_page: 10,
          })
          const readmeRepo = readmeCodeResp.data.items?.[0]?.repository
          if (!readmeRepo?.owner?.login || !readmeRepo.name) throw new Error('No README.md match found.')

          const readmeRepoResp = await octokit.rest.repos.get({
            owner: readmeRepo.owner.login,
            repo: readmeRepo.name,
          })
          matchedRepo = readmeRepoResp.data
        } catch {
          // Fall through to the next fallback.
        }
      }

      if (!matchedRepo) {
        try {
          const repoReadmeResp = await octokit.rest.search.repos({
            q: `${normalizedQuery} in:readme`,
            sort: 'stars',
            order: 'desc',
            per_page: 30,
            headers: { accept: 'application/vnd.github.mercy-preview+json' },
          })
          const readmeRepos = repoReadmeResp.data.items || []
          if (readmeRepos.length === 0) throw new Error('No repository README matches found.')

          matchedRepo = readmeRepos[0]
        } catch {
          // Fall through to the next fallback.
        }
      }

      if (!matchedRepo) {
        try {
          const descriptionResp = await octokit.rest.search.repos({
            q: `${normalizedQuery} in:description`,
            sort: 'stars',
            order: 'desc',
            per_page: 30,
            headers: { accept: 'application/vnd.github.mercy-preview+json' },
          })
          const descriptionRepos = descriptionResp.data.items || []
          if (descriptionRepos.length === 0) throw new Error('No repository descriptions matched.')

          matchedRepo = descriptionRepos[0]
        } catch {
          // Fall through to the next fallback.
        }
      }

      if (!matchedRepo) {
        try {
          const commitsResp = await octokit.rest.search.commits({
            q: normalizedQuery,
            sort: 'author-date',
            order: 'desc',
            per_page: 10,
            headers: { accept: 'application/vnd.github.cloak-preview+json' },
          })
          const commitRepo = commitsResp.data.items?.[0]?.repository
          if (!commitRepo?.owner?.login || !commitRepo.name) throw new Error('No commit matches found.')

          const commitRepoResp = await octokit.rest.repos.get({
            owner: commitRepo.owner.login,
            repo: commitRepo.name,
          })
          matchedRepo = commitRepoResp.data
        } catch {
          // Fall through. This is the final fallback.
        }
      }

      if (!matchedRepo) {
        setError('All possible searches have been done and none is working.')
        return
      }

      selectRepository(matchedRepo)
      await GoogleGenAISearch(matchedRepo)
    } catch {
      setError('All possible searches have been done and none is working.')
    } finally {
      await jobsPromise
      setLoading(false)
    }
  }

  async function GoogleGenAISearch(repository = currentRepository) {
    if (!ai) {
      setError('Missing Gemini key. Add VITE_GEMINI_API_KEY to .env and restart the dev server.')
      return
    }

    try {
      const selectedRepository = repository || currentRepository
      const repositorySummary = selectedRepository
        ? `Repository name: ${selectedRepository.name}
Description: ${selectedRepository.description}
Language: ${selectedRepository.language}
License: ${selectedRepository.license?.name || 'N/A'}
`
        : 'No repository currently selected.'

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${repositorySummary} related to the following query please suggest schools or universities that  have majors related to this repository `,
      })

      const suggestedQuery = response.text.trim()
      console.log('GoogleGenAI suggested query:', suggestedQuery)
    } catch (err) {
      console.error('GoogleGenAI search failed:', err)
      setError('GoogleGenAI search failed. Check console for details.')
    }
  }

  const fetchNews = () => loadFeatured()


  return (
    <Routes>
      <Route
        path="/"
        element={
          <Home
            currentRepository={currentRepository}
            currentJob={currentJob}
            onPickImage={() => {}}
            fetchNews={fetchNews}
            loading={loading}
            error={error}
            jobsError={jobsError}
            previousRepositories={previousRepositories}
            previousJobs={previousJobs}
            searchRepositories={searchRepositories}
          />
        }
      />
    </Routes>
  )
}

export default App
