import React from 'react'

const autolinkMatchers: AutolinkMatcher[] = [
  // Commonly known protocols.
  buildAutoLinkMatcher(
    /((?:https?|mailto|ftp|tel):[/.-\w\d]*(?::\d+)?)(?:[.-])?/i,
    match => match[1],
  ),

  // Emails
  buildAutoLinkMatcher(
    /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}])|(([\w\-\d]+\.)+[\w]{2,}))/i,
    match => `mailto:${match[0]}`,
  ),

  // Web links (secure).
  buildAutoLinkMatcher(
    /(www\.)?[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?/i,
    match => `https://${match[0]}`,
  ),

  // Phone numbers
  buildAutoLinkMatcher(
    /[+()\d][-()\d ][-()\d ]{3,}/i,
    match => `tel:${match[0]}`,
  ),
]

export function findLinks(text: string, options: AutolinkOptions = {}): LinkRange[] {
  const matchers = [
    ...autolinkMatchers,
    ...options.extraMatchers ?? [],
  ]

  const results: LinkRange[] = []

  let offset: number = 0
  while (offset < text.length) {
    const remainder = text.slice(offset)

    const matches = matchers.map(matcher => [
      matcher,
      remainder.match(matcher.regexp),
    ] as const).filter(([, match]) => match != null && match.index != null)

    if (matches.length === 0) { break }

    matches.sort((a, b) => a[1]!.index! - b[1]!.index!)

    const matcher = matches[0][0]
    const match = matches[0][1]!

    const url = matcher.parse(match)
    if (url == null) { continue }

    results.push({
      offset: offset + match.index!,
      length: match[0].length,
      url,
    })

    offset += match.index! + match[0].length
  }

  return results
}

export function applyLinks(text: string, links: LinkRange[]) {
  const out: React.ReactNode[] = []

  let offset: number = 0
  for (const link of links) {
    if (offset >= text.length) { break }

    if (link.offset > offset) {
      out.push(text.slice(offset, link.offset - offset))
    }
    out.push(React.createElement('a', {
      key:    offset,
      href:   link.url,
      rel:    'noreferrer',
      target: '_blank',
    }, text.slice(link.offset, Math.min(link.offset + link.length, text.length))))

    offset = Math.min(link.offset + link.length, text.length)
  }

  if (offset < text.length) {
    out.push(text.slice(offset))
  }
  return out
}

export function buildAutoLinkMatcher(regexp: RegExp, parse: (capture: RegExpMatchArray) => string | null) {
  return {
    regexp,
    parse,
  }
}

export interface AutolinkOptions {
  extraMatchers?: AutolinkMatcher[]
}

export interface LinkRange {
  offset: number
  length: number
  url:    string
}

export interface AutolinkMatcher {
  regexp: RegExp
  parse:  (capture: RegExpMatchArray) => string | null
}
