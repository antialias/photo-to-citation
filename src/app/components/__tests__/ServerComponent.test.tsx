import React from "react"
import { render, screen } from '@testing-library/react'
import ServerComponent from '../ServerComponent'
import { describe, it, expect } from 'vitest'


describe('ServerComponent', () => {
  it('renders text', async () => {
    const element = await ServerComponent()
    render(element)
    expect(screen.getByText('Server Component')).toBeInTheDocument()
  })
})
