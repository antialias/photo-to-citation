import React from "react"
import { render, screen } from '@testing-library/react'
import Home from '../page'
import { describe, it, expect } from 'vitest'

describe('Home page', () => {
  it('renders Deploy now link', () => {
    render(<Home />)
    expect(screen.getByText('Deploy now')).toBeInTheDocument()
  })
})
