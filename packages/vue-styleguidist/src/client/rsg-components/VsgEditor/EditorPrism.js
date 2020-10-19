import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cx from 'classnames'
import { isCodeVueSfc } from 'vue-inbrowser-compiler-utils'
import { polyfill } from 'react-lifecycles-compat'
import SimpleEditor from 'react-simple-code-editor'
import { highlight as prismHighlight, languages } from 'prismjs'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import { space } from 'react-styleguidist/lib/client/styles/theme'
import prismTheme from 'react-styleguidist/lib/client/styles/prismTheme'
import Styled from 'rsg-components/Styled'
import { useStyleGuideContext } from 'rsg-components/Context'
import getScript from '../../../loaders/utils/getScript'

const highlight = (lang, jsxInExamples) => {
	if (lang === 'vsg') {
		return code => {
			if (!code) {
				return ''
			}
			const scriptCode = getScript(code, jsxInExamples)
			const scriptCodeHighlighted = prismHighlight(
				scriptCode,
				languages[jsxInExamples ? 'jsx' : 'js'],
				lang
			)
			if (code.length === scriptCode.length) {
				return scriptCodeHighlighted
			}
			const templateCode = code.slice(scriptCode.length)
			return scriptCodeHighlighted + prismHighlight(templateCode, languages.html, lang)
		}
	} else {
		const langScheme = languages[lang]
		return code => prismHighlight(code, langScheme, lang)
	}
}

const styles = ({ fontFamily, fontSize, color, borderRadius }) => ({
	root: {
		fontFamily: fontFamily.monospace,
		fontSize: fontSize.small,
		borderRadius,
		'& textarea': {
			isolate: false,
			transition: 'all ease-in-out .1s',
			// important to override inline styles in react-simple-code-editor
			border: `1px ${color.border} solid !important`,
			borderRadius
		},
		'& textarea:focus': {
			isolate: false,
			outline: 0,
			borderColor: `${color.link} !important`,
			boxShadow: [[0, 0, 0, 2, color.focus]]
		}
	},
	jssEditor: {
		background: color.codeBackground,
		...prismTheme({ color })
	}
})

export class UnconfiguredEditor extends Component {
	static propTypes = {
		classes: PropTypes.objectOf(PropTypes.string.isRequired).isRequired,
		code: PropTypes.string.isRequired,
		jssThemedEditor: PropTypes.bool.isRequired,
		jsxInExamples: PropTypes.bool.isRequired,
		onChange: PropTypes.func.isRequired,
		editorPadding: PropTypes.number
	}

	state = { code: this.props.code, prevCode: this.props.code }

	static getDerivedStateFromProps(nextProps, prevState) {
		const { code } = nextProps
		if (prevState.prevCode !== code) {
			return {
				prevCode: code,
				code
			}
		}
		return null
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextState.code !== this.state.code
	}

	handleChange = code => {
		this.setState({ code })
		this.props.onChange(code)
	}

	render() {
		const { root, jssEditor } = this.props.classes
		const isVueSFC = isCodeVueSfc(this.state.code)
		const { jssThemedEditor, jsxInExamples, editorPadding } = this.props
		const langClass = isVueSFC ? 'language-html' : 'language-jsx'
		return (
			<SimpleEditor
				className={cx(root, jssThemedEditor ? jssEditor : langClass, 'prism-editor')}
				value={this.state.code}
				onValueChange={this.handleChange}
				highlight={highlight(isVueSFC ? 'html' : 'vsg', jsxInExamples)}
				// Padding should be passed via a prop (not CSS) for a proper
				// cursor position calculation
				padding={editorPadding || space[2]}
				// to make sure the css styles for prism are taken into account
				preClassName={cx(!jssThemedEditor && langClass)}
			/>
		)
	}
}

const PEditor = polyfill(UnconfiguredEditor)

function Editor(props) {
	const {
		config: { jssThemedEditor, jsxInExamples }
	} = useStyleGuideContext()
	return <PEditor {...props} jssThemedEditor={jssThemedEditor} jsxInExamples={jsxInExamples} />
}

export default Styled(styles)(Editor)
