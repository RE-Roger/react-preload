import React from 'react';
import PropTypes from 'prop-types';
import ImageHelper from './ImageHelper';

const propTypes = {
    // Rendered on success
    children: PropTypes.element.isRequired,

    // Rendered during load
    loadingIndicator: PropTypes.node,

    // Array of image urls to be preloaded
    images: PropTypes.arrayOf(PropTypes.string),

    // If set, the preloader will automatically show
    // the children content after this amount of time
    autoResolveDelay: PropTypes.number,

    // Error callback. Is passed the error
    onError: PropTypes.func,

    // Success callback
    onSuccess: PropTypes.func,


    onUpdate: PropTypes.func,
    // Whether or not we should still show the content
    // even if there is a preloading error
    resolveOnError: PropTypes.bool,

    // Whether or not we should mount the child content after
    // images have finished loading (or after autoResolveDelay)
    mountChildren: PropTypes.bool
};

const defaultProps = {
    loadingIndicator: null,
    images: [],
    autoResolveDelay: 0,
    onError: null,
    onUpdate : null,
    onSuccess: null,
    resolveOnError: true,
    mountChildren: true
};

class Preload extends React.Component {
    constructor(...args) {
        var _temp;

        return _temp = super(...args), this._mounted = false, this.state = {
            ready: false
        }, this.loadImages = () => {
            const { images, autoResolveDelay } = this.props;
            const { onUpdate } = this.props;
            ImageHelper.loadImages(images, {onUpdate:onUpdate}).then(this._handleSuccess, this._handleError);

            if (autoResolveDelay && autoResolveDelay > 0) {
                this.autoResolveTimeout = setTimeout(this._handleAutoResolve, autoResolveDelay);
            }
        }, this._handleAutoResolve = () => {
            this._handleSuccess({ didAutoResolve: true });
        }, this._handleSuccess = ({ didError, didAutoResolve } = {}) => {
            if (this.autoResolveTimeout) {
                clearTimeout(this.autoResolveTimeout);
                this.autoResolveTimeout = null;
            }

            const { ready } = this.state;
            if (ready || !this._mounted) {
                return;
            }

            this.setState({
                ready: true
            });

            const { onSuccess } = this.props;
            if (onSuccess) {
                onSuccess({ didError, didAutoResolve });
            }
        }, this._handleError = err => {
            if (!this._mounted) {
                return;
            }

            const { resolveOnError, onError } = this.props;

            if (resolveOnError) {
                this._handleSuccess({ didError: true, error: err });
            }

            if (onError) {
                onError(err);
            }
        }, _temp;
    }

    componentWillMount() {
        const { images } = this.props;
        if (!images || images.length === 0) {
            this._handleSuccess();
        }
    }

    componentDidMount() {
        this._mounted = true;
        this.loadImages();
    }

    componentDidUpdate(prevProps) {
        const { images } = this.props;
        const oldImages = new Set(prevProps.images);

        let hasChanged = false;
        for (let i = 0; i < images.length; i += 1) {
            const image = images[i];
            if (!oldImages.has(image)) {
                hasChanged = true;
                break;
            }
        }

        if (hasChanged) {
            this.loadImages();
        }
    }

    componentWillUnmount() {
        this._mounted = false;
        if (this.autoResolveTimeout) {
            clearTimeout(this.autoResolveTimeout);
        }
    }

    render() {
        const { ready } = this.state;
        const { mountChildren, children, loadingIndicator } = this.props;

        return ready && mountChildren ? children : loadingIndicator;
    }
}

Preload.propTypes = propTypes;
Preload.defaultProps = defaultProps;

export default Preload;
