import React from "react"
import { render, screen } from '@testing-library/react'
import Home from '../page'
import { describe, it, expect } from 'vitest'

describe('Home page', () => {
  it('renders main navigation links', () => {
    render(<Home />)
    expect(screen.getByText('Upload a Photo')).toBeInTheDocument()
    expect(screen.getByText('View Cases')).toBeInTheDocument()
  })
})
